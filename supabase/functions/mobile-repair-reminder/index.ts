import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !accountSid || !authToken || !fromNumber) {
    return Response.json({ error: "SMS is not configured. Set the Supabase and Twilio function secrets." }, { status: 503, headers: corsHeaders });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return Response.json({ error: "Sign-in required." }, { status: 401, headers: corsHeaders });
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userResult, error: userError } = await callerClient.auth.getUser();
  if (userError || !userResult.user) {
    return Response.json({ error: "Sign-in required." }, { status: 401, headers: corsHeaders });
  }
  const { data: profile, error: profileError } = await callerClient
    .from("profiles")
    .select("role")
    .eq("id", userResult.user.id)
    .maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return Response.json({ error: "Administrator access required." }, { status: 403, headers: corsHeaders });
  }

  let repairId: string;
  try {
    const body = await request.json();
    repairId = body.repair_id;
    if (typeof repairId !== "string" || !/^[0-9a-f-]{36}$/i.test(repairId)) {
      return Response.json({ error: "A valid repair_id is required." }, { status: 400, headers: corsHeaders });
    }
  } catch {
    return Response.json({ error: "A valid JSON request body is required." }, { status: 400, headers: corsHeaders });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: repair, error: repairError } = await adminClient
    .from("mobile_repairs")
    .select("id,status,service_type,phone_number,contact_phone,device_model,full_address,address,city,time_slot,visit_date,recipient_name,call_reminder_sent")
    .eq("id", repairId)
    .eq("service_type", "mobile")
    .maybeSingle();
  if (repairError) {
    console.error("Could not load mobile repair for reminder.", repairError.message);
    return Response.json({ error: "Could not load the repair request." }, { status: 500, headers: corsHeaders });
  }
  if (!repair) {
    return Response.json({ error: "Repair request not found." }, { status: 404, headers: corsHeaders });
  }
  if (repair.status !== "in_progress") {
    return Response.json({ error: "The SMS reminder is only sent when the technician is on the way." }, { status: 409, headers: corsHeaders });
  }
  if (repair.call_reminder_sent) {
    return Response.json({ already_sent: true }, { status: 200, headers: corsHeaders });
  }

  const phone = String(repair.phone_number || repair.contact_phone || "").replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return Response.json({ error: "The saved phone number must use international format, for example +34600123456." }, { status: 422, headers: corsHeaders });
  }
  const { data: claim, error: claimError } = await adminClient
    .from("mobile_repairs")
    .update({ call_reminder_sent: true })
    .eq("id", repair.id)
    .eq("status", "in_progress")
    .eq("call_reminder_sent", false)
    .select("id")
    .maybeSingle();
  if (claimError) {
    console.error("Could not claim the mobile repair reminder.", claimError.message);
    return Response.json({ error: "Could not reserve the SMS reminder attempt." }, { status: 500, headers: corsHeaders });
  }
  if (!claim) {
    const { data: latest, error: latestError } = await adminClient
      .from("mobile_repairs")
      .select("status,call_reminder_sent")
      .eq("id", repair.id)
      .maybeSingle();
    if (latestError) {
      console.error("Could not recheck the mobile repair reminder state.", latestError.message);
      return Response.json({ error: "Could not recheck the SMS reminder state." }, { status: 500, headers: corsHeaders });
    }
    if (latest?.call_reminder_sent) {
      return Response.json({ already_sent: true }, { status: 200, headers: corsHeaders });
    }
    return Response.json({ error: "The repair status changed before the SMS could be sent." }, { status: 409, headers: corsHeaders });
  }
  const date = repair.visit_date
    ? new Date(repair.visit_date).toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "medium", timeStyle: "short" })
    : repair.time_slot || "";
  const message = `BarsukON: el técnico está de camino para reparar ${repair.device_model || "tu dispositivo"} en ${repair.full_address || repair.address || ""}, ${repair.city || ""}. ${date ? `Cita: ${date}. ` : ""}Si necesitas ayuda, responde a este mensaje.`;
  const form = new URLSearchParams({ To: phone, From: fromNumber, Body: message });
  const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  if (!twilioResponse.ok) {
    console.error("Twilio rejected a mobile repair reminder.", twilioResponse.status);
    const { error: releaseError } = await adminClient
      .from("mobile_repairs")
      .update({ call_reminder_sent: false })
      .eq("id", repair.id)
      .eq("call_reminder_sent", true);
    if (releaseError) console.error("Could not release the failed SMS reminder claim.", releaseError.message);
    return Response.json({ error: "Twilio could not send the reminder. Check the function logs and provider configuration." }, { status: 502, headers: corsHeaders });
  }

  return Response.json({ sent: true }, { status: 200, headers: corsHeaders });
});
