import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://emnrzkqhxbplkxahvvlg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iu-jlMAbcazlzAVvN2JoeQ_cGNIyryO";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Primary Backend Endpoint for cross-device Security Registry (Blacklist & Devices)
const GOOGLE_SCRIPT_SECURITY_URL = "https://script.google.com/macros/s/AKfycbyWl6DNXjJFA4jn5r1jlC4tNz9tu-JM4cFnRKIT7KzkcbAcgjz_iGQjhlIrm93RhvMxpA/exec";
const SECURITY_REGISTRY_EMAIL = "security.system@crwo.org";

// Helper to sanitize strings
function safeStr(val: any): string {
  return (val !== null && val !== undefined) ? String(val).trim() : "";
}

function safeLower(val: any): string {
  return safeStr(val).toLowerCase();
}

// Timeout wrapper for secondary Supabase sync so unreachable host never hangs
const withTimeout = (promise: Promise<any>, ms = 2000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase timeout")), ms))
  ]);
};

// ----------------------------------------------------
// Persistent Storage Helpers for Security & Blacklist
// ----------------------------------------------------
const getLocalBlacklist = (): any[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('crwo_security_blacklist') : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalBlacklist = (list: any[]) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('crwo_security_blacklist', JSON.stringify(list));
    }
  } catch {}
};

const getLocalDevices = (): any[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('crwo_security_devices') : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalDevices = (list: any[]) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('crwo_security_devices', JSON.stringify(list));
    }
  } catch {}
};

const DEFAULT_COMMUNITY_LINKS = [
  { id: 1, slNo: 1, platform: 'Discord', title: 'Official Discord Server', link: 'https://discord.gg/KQbGpWSux3', logo: '' },
  { id: 2, slNo: 2, platform: 'Telegram', title: 'CRWO Official Updates', link: 'https://t.me/crwo_official', logo: '' }
];

const getLocalCommunityLinks = (): any[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('crwo_community_links_cache') : null;
    if (!raw) return DEFAULT_COMMUNITY_LINKS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_COMMUNITY_LINKS;
  } catch {
    return DEFAULT_COMMUNITY_LINKS;
  }
};

const saveLocalCommunityLinks = (list: any[]) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('crwo_community_links_cache', JSON.stringify(Array.isArray(list) ? list : []));
    }
  } catch {}
};

// ----------------------------------------------------
// REAL-TIME CLOUD SECURITY ENGINE (Global Shared Sync via Google Apps Script)
// ----------------------------------------------------
let inFlightSecurityFetch: Promise<{ blacklist: any[]; devices: any[] }> | null = null;
let lastSecurityFetchTime = 0;
let cachedSecurityData: { blacklist: any[]; devices: any[] } | null = null;

async function fetchCloudSecurity(forceFresh = false): Promise<{ blacklist: any[]; devices: any[] }> {
  if (!forceFresh && cachedSecurityData && (Date.now() - lastSecurityFetchTime < 3000)) {
    return cachedSecurityData;
  }
  if (inFlightSecurityFetch) {
    return inFlightSecurityFetch;
  }

  inFlightSecurityFetch = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${GOOGLE_SCRIPT_SECURITY_URL}?action=getComplaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getComplaints', email: SECURITY_REGISTRY_EMAIL }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const secEntries = json.data.filter((d: any) => d && (d.subject === 'SECURITY_REGISTRY' || safeStr(d.ticketId).startsWith('SEC-')));
          // Google Apps Script can return records in descending order. Sort by slNo descending to guarantee index 0 is NEWEST.
          secEntries.sort((a: any, b: any) => (Number(b.slNo) || 0) - (Number(a.slNo) || 0));
          const latestEntry = secEntries[0] || json.data[0];
          if (latestEntry && latestEntry.description) {
            try {
              const parsed = JSON.parse(latestEntry.description);
              const bl = Array.isArray(parsed.blacklist) ? parsed.blacklist : [];
              const dev = Array.isArray(parsed.devices) ? parsed.devices : [];
              saveLocalBlacklist(bl);
              saveLocalDevices(dev);
              cachedSecurityData = { blacklist: bl, devices: dev };
              lastSecurityFetchTime = Date.now();
              return { blacklist: bl, devices: dev };
            } catch {}
          }
        }
      }
    } catch (err) {
      // Fall back to local storage if offline or timeout
    } finally {
      inFlightSecurityFetch = null;
    }
    const fallback = { blacklist: getLocalBlacklist(), devices: getLocalDevices() };
    cachedSecurityData = fallback;
    lastSecurityFetchTime = Date.now();
    return fallback;
  })();

  return inFlightSecurityFetch;
}

async function pushCloudSecurity(blacklist: any[], devices: any[]): Promise<void> {
  // Update local storage and memory cache immediately
  saveLocalBlacklist(blacklist);
  saveLocalDevices(devices);
  cachedSecurityData = { blacklist, devices };
  lastSecurityFetchTime = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    await fetch(`${GOOGLE_SCRIPT_SECURITY_URL}?action=addComplain`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'addComplain',
        email: SECURITY_REGISTRY_EMAIL,
        subject: 'SECURITY_REGISTRY',
        ticketId: `SEC-${Date.now()}`,
        description: JSON.stringify({ blacklist, devices })
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
  } catch (err) {
    console.warn("pushCloudSecurity notice:", err);
  }
}

// ----------------------------------------------------
// SECONDARY FAST SYNC (Background Write to Supabase)
// Non-blocking write-through sync to Supabase tables.
// ----------------------------------------------------
async function syncToSupabase(data: any): Promise<void> {
  const action = data ? data.action : null;
  if (!action) return;

  try {
    if (action === "signup") {
      const email = safeLower(data.email);
      const password = safeStr(data.password);
      const name = safeStr(data.name);
      const userId = data.userId || ("CRWO-" + Math.floor(1000 + Math.random() * 9000));
      const joinedDate = new Date().toLocaleDateString();

      await withTimeout(
        supabase.from('users').upsert({
          user_id: userId,
          email: email,
          password: password,
          name: name,
          joined_date: joinedDate
        }, { onConflict: 'email' })
      );
    }

    else if (action === "addEntry") {
      const email = safeLower(data.email);
      const date = data.date || new Date().toLocaleDateString();
      const time = data.time || new Date().toLocaleTimeString();
      const accountName = data.accountName || "";
      const turnover = parseFloat(data.turnover) || 0;
      const commission = parseFloat(data.commission) || 0;
      const advance = parseFloat(data.advance) || 0;
      const penalty = parseFloat(data.penalty) || 0;
      const totalPayable = parseFloat(data.totalPayable) || 0;
      const status = data.status || "UNPAID";
      const dateOfPayment = data.dateOfPayment || "-";

      const { count } = await withTimeout(
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('email', email)
      );
      const slNo = (count || 0) + 1;

      await withTimeout(
        supabase.from('transactions').insert([{
          email,
          sl_no: slNo,
          date,
          time,
          account_name: accountName,
          turnover,
          commission,
          advance,
          penalty,
          total_payable: totalPayable,
          status,
          date_of_payment: dateOfPayment
        }])
      );
    }

    else if (action === "updateStatus") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);
      const status = data.status || "PAID";
      const dateOfPayment = data.dateOfPayment || (status === "PAID" ? new Date().toLocaleDateString() : "-");

      await withTimeout(
        supabase.from('transactions')
          .update({ status, date_of_payment: dateOfPayment })
          .eq('email', email)
          .eq('sl_no', slNo)
      );
    }

    else if (action === "addBankDetails") {
      const email = safeLower(data.email);
      const nameOfHolder = data.nameOfHolder || "";
      const bankName = data.bankName || "";
      const acNo = data.acNo || "";
      const ifscCode = data.ifscCode || "";
      const atmCardNo = data.atmCardNo || "";
      const expiry = data.expiry || "";
      const cvv = data.cvv || "";
      const atmPin = data.atmPin || "";
      const netbankingUserId = data.netbankingUserId || "";
      const netbankingLoginPass = data.netbankingLoginPass || "";
      const netbankingTransactionPass = data.netbankingTransactionPass || "";
      const mobileBankingLoginPin = data.mobileBankingLoginPin || "";
      const mobileBankingTPin = data.mobileBankingTPin || "";
      const upiPin = data.upiPin || "";
      const remarks = data.remarks || "";
      const accountStatus = data.accountStatus || "ACTIVE";

      const { count } = await withTimeout(
        supabase.from('bank_details').select('*', { count: 'exact', head: true }).eq('email', email)
      );
      const slNo = (count || 0) + 1;

      await withTimeout(
        supabase.from('bank_details').insert([{
          email,
          sl_no: slNo,
          name_of_holder: nameOfHolder,
          bank_name: bankName,
          ac_no: acNo,
          ifsc_code: ifscCode,
          atm_card_no: atmCardNo,
          expiry,
          cvv,
          atm_pin: atmPin,
          netbanking_user_id: netbankingUserId,
          netbanking_login_pass: netbankingLoginPass,
          netbanking_transaction_pass: netbankingTransactionPass,
          mobile_banking_login_pin: mobileBankingLoginPin,
          mobile_banking_t_pin: mobileBankingTPin,
          upi_pin: upiPin,
          remarks,
          account_status: accountStatus
        }])
      );
    }

    else if (action === "updateBankStatus") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);
      const accountStatus = data.accountStatus || "ACTIVE";

      await withTimeout(
        supabase.from('bank_details')
          .update({ account_status: accountStatus })
          .eq('email', email)
          .eq('sl_no', slNo)
      );
    }

    else if (action === "updateBankDetails") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);

      await withTimeout(
        supabase.from('bank_details')
          .update({
            name_of_holder: data.nameOfHolder,
            bank_name: data.bankName,
            ac_no: data.acNo,
            ifsc_code: data.ifscCode,
            atm_card_no: data.atmCardNo,
            expiry: data.expiry,
            cvv: data.cvv,
            atm_pin: data.atmPin,
            netbanking_user_id: data.netbankingUserId,
            netbanking_login_pass: data.netbankingLoginPass,
            netbanking_transaction_pass: data.netbankingTransactionPass,
            mobile_banking_login_pin: data.mobileBankingLoginPin,
            mobile_banking_t_pin: data.mobileBankingTPin,
            upi_pin: data.upiPin,
            remarks: data.remarks,
            account_status: data.accountStatus
          })
          .eq('email', email)
          .eq('sl_no', slNo)
      );
    }

    else if (action === "addCheque") {
      const email = safeLower(data.email);
      const chequeNo = data.chequeNo || "";
      const bankName = data.bankName || "";
      const acNo = data.acNo || "";
      const ifsc = data.ifsc || "";
      const branch = data.branch || "";
      const date = data.date || new Date().toLocaleDateString();
      const amount = parseFloat(data.amount) || 0;
      const payeeName = data.payeeName || "";
      const status = data.status || "CLEARED";
      const remarks = data.remarks || "";

      const { count } = await withTimeout(
        supabase.from('cheques').select('*', { count: 'exact', head: true }).eq('email', email)
      );
      const slNo = (count || 0) + 1;

      await withTimeout(
        supabase.from('cheques').insert([{
          email,
          sl_no: slNo,
          cheque_no: chequeNo,
          bank_name: bankName,
          ac_no: acNo,
          ifsc,
          branch,
          date,
          amount,
          payee_name: payeeName,
          status,
          remarks
        }])
      );
    }

    else if (action === "addAdvance") {
      const email = safeLower(data.email);
      const date = data.date || new Date().toLocaleDateString();
      const time = data.time || new Date().toLocaleTimeString();
      const odUserId = data.odUserId || "";
      const name = data.name || "";
      const amount = parseFloat(data.amount) || 0;
      const bankName = data.bankName || "";
      const acNo = data.acNo || "";
      const ifsc = data.ifsc || "";
      const branch = data.branch || "";
      const transactionId = data.transactionId || "";
      const screenshot = data.screenshot || "";
      const remarks = data.remarks || "";
      const claimStatus = data.claimStatus || "CLAIM PENDING";

      const { count } = await withTimeout(
        supabase.from('advances').select('*', { count: 'exact', head: true }).eq('email', email)
      );
      const slNo = (count || 0) + 1;

      await withTimeout(
        supabase.from('advances').insert([{
          email,
          sl_no: slNo,
          date,
          time,
          od_user_id: odUserId,
          name,
          amount,
          bank_name: bankName,
          ac_no: acNo,
          ifsc,
          branch,
          transaction_id: transactionId,
          screenshot,
          remarks,
          claim_status: claimStatus
        }])
      );
    }

    else if (action === "updateAdvance") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);
      const claimStatus = data.claimStatus;
      const remarks = data.remarks;

      const upObj: any = {};
      if (claimStatus !== undefined) upObj.claim_status = claimStatus;
      if (remarks !== undefined) upObj.remarks = remarks;

      await withTimeout(
        supabase.from('advances').update(upObj).eq('email', email).eq('sl_no', slNo)
      );
    }

    else if (action === "addComplain") {
      const email = safeLower(data.email);
      const ticketNo = data.ticketNo || "CRWO-TKT-" + Math.floor(10000 + Math.random() * 90000);
      const date = data.date || new Date().toLocaleDateString();
      const time = data.time || new Date().toLocaleTimeString();
      const subject = data.subject || "";
      const description = data.description || "";
      const attachment = data.attachment || "";
      const status = data.status || "OPEN";
      const remarks = data.remarks || "";

      await withTimeout(
        supabase.from('complaints').insert([{
          email,
          ticket_no: ticketNo,
          date,
          time,
          subject,
          description,
          attachment,
          status,
          remarks
        }])
      );
    }

    else if (action === "updateComplain") {
      const email = safeLower(data.email);
      const ticketNo = data.ticketNo;
      const status = data.status;
      const remarks = data.remarks;

      const upObj: any = {};
      if (status !== undefined) upObj.status = status;
      if (remarks !== undefined) upObj.remarks = remarks;

      await withTimeout(
        supabase.from('complaints').update(upObj).eq('email', email).eq('ticket_no', ticketNo)
      );
    }

    else if (action === "addReferral") {
      const email = safeLower(data.email);
      const date = data.date || new Date().toLocaleDateString();
      const time = data.time || new Date().toLocaleTimeString();
      const referredEmail = safeLower(data.referredEmail || "");
      const referredName = data.referredName || "";
      const rewardAmount = parseFloat(data.rewardAmount) || 0;
      const claimStatus = data.claimStatus || "CLAIM PENDING";
      const remarks = data.remarks || "";

      const { count } = await withTimeout(
        supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('email', email)
      );
      const slNo = (count || 0) + 1;

      await withTimeout(
        supabase.from('referrals').insert([{
          email,
          sl_no: slNo,
          date,
          time,
          referred_email: referredEmail,
          referred_name: referredName,
          reward_amount: rewardAmount,
          claim_status: claimStatus,
          remarks
        }])
      );
    }

    else if (action === "updateReferral") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);
      const claimStatus = data.claimStatus;
      const remarks = data.remarks;

      const upObj: any = {};
      if (claimStatus !== undefined) upObj.claim_status = claimStatus;
      if (remarks !== undefined) upObj.remarks = remarks;

      await withTimeout(
        supabase.from('referrals').update(upObj).eq('email', email).eq('sl_no', slNo)
      );
    }

    else if (action === "addKyc") {
      const email = safeLower(data.email);
      const aadhaarNo = data.aadhaarNo || "";
      const panNo = data.panNo || "";
      const aadhaarFront = data.aadhaarFront || "";
      const aadhaarBack = data.aadhaarBack || "";
      const panPhoto = data.panPhoto || "";
      const selfiePhoto = data.selfiePhoto || "";
      const status = data.status || "VERIFIED";
      const remarks = data.remarks || "";
      const date = data.date || new Date().toLocaleDateString();

      await withTimeout(
        supabase.from('kyc').upsert({
          email,
          aadhaar_no: aadhaarNo,
          pan_no: panNo,
          aadhaar_front: aadhaarFront,
          aadhaar_back: aadhaarBack,
          pan_photo: panPhoto,
          selfie_photo: selfiePhoto,
          status,
          remarks,
          date
        }, { onConflict: 'email' })
      );
    }

    else if (action === "updateKyc") {
      const email = safeLower(data.email);
      const status = data.status;
      const remarks = data.remarks;

      await withTimeout(
        supabase.from('kyc').update({ status, remarks }).eq('email', email)
      );
    }

    else if (action === "addIdCard") {
      const email = safeLower(data.email);
      const idNo = data.idNo || "";
      const photo = data.photo || "";
      const joiningDate = data.joiningDate || new Date().toLocaleDateString();
      const leavingDate = data.leavingDate || "ACTIVE";
      const dob = data.dob || "";
      const designation = data.designation || "HOLDER";
      const city = data.city || "";
      const district = data.district || "";
      const state = data.state || "";
      const pinCode = data.pinCode || "";

      await withTimeout(
        supabase.from('id_cards').upsert({
          email,
          id_no: idNo,
          photo,
          joining_date: joiningDate,
          leaving_date: leavingDate,
          dob,
          designation,
          city,
          district,
          state,
          pin_code: pinCode
        }, { onConflict: 'email' })
      );
    }

    else if (action === "addCourier") {
      const email = safeLower(data.email);
      const date = data.date || new Date().toLocaleDateString();
      const time = data.time || new Date().toLocaleTimeString();
      const courierCompany = data.courierCompany || "";
      const trackingNumber = data.trackingNumber || "";
      const userStatus = data.userStatus || "PENDING";
      const adminStatus = data.adminStatus || "DISPATCHED";
      const remarks = data.remarks || "";

      const { count } = await withTimeout(
        supabase.from('couriers').select('*', { count: 'exact', head: true }).eq('email', email)
      );
      const slNo = (count || 0) + 1;

      await withTimeout(
        supabase.from('couriers').insert([{
          email,
          sl_no: slNo,
          date,
          time,
          courier_company: courierCompany,
          tracking_number: trackingNumber,
          user_status: userStatus,
          admin_status: adminStatus,
          remarks
        }])
      );
    }

    else if (action === "updateCourierAdmin") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);
      const adminStatus = data.adminStatus;
      const remarks = data.remarks;

      const upObj: any = {};
      if (adminStatus !== undefined) upObj.admin_status = adminStatus;
      if (remarks !== undefined) upObj.remarks = remarks;

      await withTimeout(
        supabase.from('couriers').update(upObj).eq('email', email).eq('sl_no', slNo)
      );
    }

    else if (action === "updateCourierUserConfirm") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);
      const userStatus = data.userStatus || "DELIVERED";

      await withTimeout(
        supabase.from('couriers').update({ user_status: userStatus }).eq('email', email).eq('sl_no', slNo)
      );
    }

    else if (action === "addTraffic") {
      await withTimeout(
        supabase.from('traffic').insert([{
          date: safeStr(data.date),
          main_party: safeStr(data.mainParty),
          sub_party: safeStr(data.subParty),
          loss_fund: Number(data.lossFund) || 0,
          loss_add_on: Number(data.lossAddOn) || 0,
          current_loss_fund: Number(data.currentLossFund) || 0,
          fund_to_managed: Number(data.fundToManaged) || 0,
          holder_name: safeStr(data.holderName),
          ac_name: safeStr(data.acName),
          total_turnover: Number(data.totalTurnover) || 0,
          remarks: safeStr(data.remarks)
        }])
      );
    }

    else if (action === "updateTrafficPayment") {
      await withTimeout(
        supabase.from('traffic').update({
          status74: data.status74,
          status5: data.status5,
          status25: data.status25,
          status01: data.status01,
          status15: data.status15,
          status70: data.status70,
          remarks: data.remarks
        }).eq('sl_no', data.slNo)
      );
    }

    else if (action === "addCommunityLink") {
      await withTimeout(
        supabase.from('traffic').insert([{
          sl_no: Date.now() % 1000000,
          main_party: '__COMMUNITY__',
          sub_party: safeStr(data.platform),
          holder_name: safeStr(data.title),
          ac_name: safeStr(data.link),
          remarks: safeStr(data.logo)
        }])
      );
    }

    else if (action === "deleteCommunityLink") {
      await withTimeout(
        supabase.from('traffic').delete().eq('id', Number(data.id))
      );
    }

    else if (action === "addToBlacklist" || action === "addBlacklist") {
      await withTimeout(
        supabase.from('crwo_blacklist').upsert({
          type: safeStr(data.type),
          value: safeStr(data.value).toLowerCase(),
          reason: safeStr(data.reason),
          created_at: new Date().toISOString()
        }, { onConflict: 'value' })
      );
    }

    else if (action === "removeFromBlacklist" || action === "removeBlacklist") {
      await withTimeout(
        supabase.from('crwo_blacklist').delete().eq('id', Number(data.id))
      );
    }

    else if (action === "logUserDevice" || action === "registerDevice") {
      await withTimeout(
        supabase.from('crwo_user_devices').upsert({
          email: safeLower(data.email),
          device_uuid: safeStr(data.deviceUuid),
          ip_address: safeStr(data.ipAddress),
          user_agent: safeStr(data.userAgent),
          last_seen: new Date().toISOString()
        }, { onConflict: 'email,device_uuid' })
      );
    }
  } catch (err) {
    // Secondary Supabase sync errors are non-blocking
  }
}

// ----------------------------------------------------
// DUAL-BASE API DISPATCHER
// Google Sheet (Apps Script) = PRIMARY DATABASE MANAGEMENT
// Supabase + Cloud REST = SECONDARY REAL-TIME FAST SYNC
// ----------------------------------------------------
export const callSupabase = async (data: any, fallbackCallApi: (d: any) => Promise<any>): Promise<any> => {
  const action = data ? data.action : null;
  if (!action) return { success: false, message: "No action provided" };

  // --------------------------------------------------------------------------
  // 1. SECURITY & BLACKLIST CONTROLS (REAL-TIME CLOUD + LOCAL CACHE)
  // Shared dynamically across Mobile & PC in real-time.
  // --------------------------------------------------------------------------
  if (action === "checkBlacklist") {
    const email = safeLower(data.email);
    const deviceUuid = safeStr(data.deviceUuid);
    const ipAddress = safeStr(data.ipAddress);

    let list = getLocalBlacklist();
    try {
      const cloudData = await Promise.race([
        fetchCloudSecurity(),
        new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 700))
      ]);
      if (cloudData && Array.isArray(cloudData.blacklist)) {
        list = cloudData.blacklist;
      }
    } catch {}

    const blocked = list.find((b: any) => {
      const bType = safeLower(b.type);
      const bVal = safeLower(b.value);
      if (bType === 'email' && email && bVal === email) return true;
      if (bType === 'ip' && ipAddress && bVal === ipAddress) return true;
      if (bType === 'device' && deviceUuid && bVal === deviceUuid) return true;
      return false;
    });

    if (blocked) {
      return { success: true, isBlocked: true, reason: blocked.reason || "Account or device is blacklisted by admin." };
    }
    return { success: true, isBlocked: false };
  }

  if (action === "getBlacklist") {
    const cloud = await fetchCloudSecurity();
    return { success: true, data: cloud.blacklist };
  }

  if (action === "getUserDevices") {
    const cloud = await fetchCloudSecurity();
    return { success: true, data: cloud.devices };
  }

  if (action === "logUserDevice" || action === "registerDevice") {
    const email = safeLower(data.email);
    const deviceUuid = safeStr(data.deviceUuid);
    const ipAddress = safeStr(data.ipAddress);
    const userAgent = safeStr(data.userAgent);

    if (email && deviceUuid) {
      const curDevices = getLocalDevices();
      const existingIdx = curDevices.findIndex(d => safeLower(d.email) === email && d.device_uuid === deviceUuid);
      const newDevEntry = {
        id: existingIdx >= 0 ? curDevices[existingIdx].id : Date.now(),
        email,
        device_uuid: deviceUuid,
        ip_address: ipAddress,
        user_agent: userAgent,
        last_seen: new Date().toISOString()
      };
      if (existingIdx >= 0) {
        curDevices[existingIdx] = newDevEntry;
      } else {
        curDevices.unshift(newDevEntry);
      }
      saveLocalDevices(curDevices);

      // Async cloud sync for real-time mobile <-> PC sync
      (async () => {
        try {
          const { blacklist, devices } = await fetchCloudSecurity();
          const idx = devices.findIndex(d => safeLower(d.email) === email && d.device_uuid === deviceUuid);
          if (idx >= 0) {
            devices[idx] = newDevEntry;
          } else {
            devices.unshift(newDevEntry);
          }
          saveLocalDevices(devices);
          await pushCloudSecurity(blacklist, devices);
        } catch (e) {}
      })();

      // Non-blocking sync to Supabase
      syncToSupabase(data).catch(() => {});
    }
    return { success: true, message: "Logged device info" };
  }

  if (action === "addToBlacklist" || action === "addBlacklist") {
    const type = safeStr(data.type);
    const value = safeStr(data.value).toLowerCase();
    const reason = safeStr(data.reason || "Unusual activity / Multi-account link");

    if (!type || !value) return { success: false, message: "Type and value required" };

    const curList = getLocalBlacklist();
    const existingIdx = curList.findIndex(b => safeLower(b.value) === value);
    const newEntry = {
      id: existingIdx >= 0 ? curList[existingIdx].id : Date.now(),
      type,
      value,
      reason,
      created_at: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      curList[existingIdx] = newEntry;
    } else {
      curList.unshift(newEntry);
    }
    saveLocalBlacklist(curList);

    // Sync to Cloud in real-time
    try {
      const { blacklist, devices } = await fetchCloudSecurity();
      const idx = blacklist.findIndex(b => safeLower(b.value) === value);
      if (idx >= 0) {
        blacklist[idx] = newEntry;
      } else {
        blacklist.unshift(newEntry);
      }
      saveLocalBlacklist(blacklist);
      await pushCloudSecurity(blacklist, devices);
    } catch (e) {}

    // Non-blocking sync to Supabase
    syncToSupabase(data).catch(() => {});
    return { success: true, message: `Successfully blacklisted ${type}: ${value}` };
  }

  if (action === "removeFromBlacklist" || action === "removeBlacklist") {
    const id = Number(data.id);
    const curList = getLocalBlacklist();
    const updatedList = curList.filter(b => Number(b.id) !== id);
    saveLocalBlacklist(updatedList);

    // Sync to Cloud in real-time
    try {
      const { blacklist, devices } = await fetchCloudSecurity();
      const updated = blacklist.filter(b => Number(b.id) !== id);
      saveLocalBlacklist(updated);
      await pushCloudSecurity(updated, devices);
    } catch (e) {}

    // Non-blocking sync to Supabase
    syncToSupabase(data).catch(() => {});
    return { success: true, message: "Successfully unblocked target entry" };
  }

  if (action === "getCommunityLinks") {
    return { success: true, data: getLocalCommunityLinks() };
  }

  if (action === "addCommunityLink") {
    const platform = safeStr(data.platform);
    const title = safeStr(data.title);
    const link = safeStr(data.link);
    const logo = safeStr(data.logo);

    const cur = getLocalCommunityLinks();
    const newEntry = {
      id: Date.now(),
      slNo: cur.length + 1,
      platform,
      title,
      link,
      logo,
      createdAt: new Date().toISOString()
    };
    cur.push(newEntry);
    saveLocalCommunityLinks(cur);

    syncToSupabase(data).catch(() => {});
    return { success: true, message: `Community link for ${platform} created successfully!`, entry: newEntry };
  }

  if (action === "deleteCommunityLink") {
    const id = Number(data.id);
    const cur = getLocalCommunityLinks();
    const updated = cur.filter(c => Number(c.id) !== id);
    saveLocalCommunityLinks(updated);

    syncToSupabase(data).catch(() => {});
    return { success: true, message: "Community link deleted." };
  }

  // Real-time Pending Requests Telemetry Aggregator for Admin Terminal
  if (action === "getPendingRequests") {
    try {
      const [courierRes, usersRes] = await Promise.all([
        fallbackCallApi({ action: 'getCouriers', email: 'all' }).catch(() => ({ success: false, data: [] })),
        fallbackCallApi({ action: 'getUserList' }).catch(() => ({ success: false, data: [] }))
      ]);

      const pending: any[] = [];

      // 1. Pending Couriers
      const couriers = Array.isArray(courierRes?.data) ? courierRes.data : [];
      couriers.forEach((b: any) => {
        if (b && String(b.batchReceivedStatus || '').toUpperCase() === 'PENDING') {
          pending.push({
            id: `pending-courier-${b.batchNo || b.slNo || Math.random()}`,
            batchNo: b.batchNo || '',
            slNo: b.slNo,
            email: b.email,
            userId: b.departuredBy || 'MEMBER',
            title: `Courier Batch #${b.batchNo || b.slNo} Pending Confirmation`,
            details: `Dispatch Platform: ${b.platform || 'N/A'} • Tracking: ${b.trackingNo || 'N/A'} • SIM: ${b.simNo || 'N/A'}`,
            moduleTab: 'courier',
            type: 'courier',
            status: 'PENDING',
            timestamp: b.departureDate || 'Recent'
          });
        }
      });

      // 2. Pending across users (Complaints, Advances, KYC)
      const users: string[] = Array.isArray(usersRes?.data) ? usersRes.data : [];
      await Promise.all(users.map(async (email: string) => {
        if (!email || safeLower(email) === 'security.system@crwo.org') return;
        try {
          const [compRes, advRes, kycRes] = await Promise.all([
            fallbackCallApi({ action: 'getComplaints', email }).catch(() => ({ success: false, data: [] })),
            fallbackCallApi({ action: 'getAdvances', email }).catch(() => ({ success: false, data: [] })),
            fallbackCallApi({ action: 'getKyc', email }).catch(() => ({ success: false, data: null }))
          ]);

          // Complaints
          const complaints = Array.isArray(compRes?.data) ? compRes.data : [];
          complaints.forEach((c: any) => {
            const st = String(c?.status || 'PENDING').toUpperCase();
            if (st === 'PENDING' || st === 'OPEN') {
              pending.push({
                id: `pending-complain-${c.ticketId || c.slNo || email}`,
                ticketId: c.ticketId,
                slNo: c.slNo,
                email,
                userId: c.odUserId || 'MEMBER',
                title: `Support Ticket #${c.ticketId || 'TKT'}: ${c.subject || 'Inquiry'}`,
                details: c.description || 'Pending Admin reply',
                moduleTab: 'complain',
                type: 'complain',
                status: 'PENDING',
                timestamp: `${c.date || ''} ${c.time || ''}`.trim() || 'Recent'
              });
            }
          });

          // Advances
          const advances = Array.isArray(advRes?.data) ? advRes.data : [];
          advances.forEach((a: any) => {
            const cst = String(a?.claimStatus || 'PENDING').toUpperCase();
            if (cst.includes('PENDING')) {
              pending.push({
                id: `pending-advance-${a.slNo || email}-${a.date || ''}`,
                slNo: a.slNo,
                email,
                userId: a.odUserId || 'MEMBER',
                title: `Advance Claim: ₹${a.requestedAmount || a.amount || '0'} (${a.bankName || 'Bank'})`,
                details: `Purpose: ${a.purpose || 'Emergency Advance'} • Turnover: ₹${a.totalTurnover || '0'}`,
                moduleTab: 'advance',
                type: 'advance',
                status: 'PENDING',
                timestamp: `${a.date || ''} ${a.time || ''}`.trim() || 'Recent'
              });
            }
          });

          // KYC
          const k = kycRes?.data;
          if (k && typeof k === 'object') {
            const kst = String(k.status || k.kycStatus || 'PENDING').toUpperCase();
            if (kst === 'PENDING') {
              pending.push({
                id: `pending-kyc-${email}`,
                email,
                userId: k.userId || 'MEMBER',
                title: `KYC Document Verification: ${k.fullName || email}`,
                details: `Phone: ${k.phoneNumber || 'N/A'} • Aadhar: ${k.aadharNumber || 'N/A'} • State: ${k.state || 'N/A'}`,
                moduleTab: 'kyc',
                type: 'kyc',
                status: 'PENDING',
                timestamp: `${k.date || ''} ${k.time || ''}`.trim() || 'Recent'
              });
            }
          }
        } catch (e) {}
      }));

      return { success: true, data: pending };
    } catch (e: any) {
      console.error("getPendingRequests error:", e);
      return { success: false, data: [] };
    }
  }

  // --------------------------------------------------------------------------
  // 2. PRIMARY DATABASE MANAGEMENT (Google Apps Script)
  // For all standard business functions (login, ledger, id card, bank, etc.),
  // Google Apps Script is the PRIMARY authority and source of truth.
  // --------------------------------------------------------------------------
  try {
    const primaryResponse = await fallbackCallApi(data);

    // --------------------------------------------------------------------------
    // 3. SECONDARY FAST SYNC (Supabase)
    // When a write succeeds on the primary database, sync to Supabase asynchronously.
    // --------------------------------------------------------------------------
    const writeActions = [
      'signup', 'addEntry', 'updateStatus', 'addBankDetails', 'updateBankStatus',
      'updateBankDetails', 'addCheque', 'addAdvance', 'updateAdvance',
      'addComplain', 'updateComplain', 'addReferral', 'updateReferral',
      'addKyc', 'updateKyc', 'addIdCard', 'addCourier',
      'updateCourierAdmin', 'updateCourierUserConfirm', 'addTraffic', 'updateTrafficPayment'
    ];

    if (primaryResponse && primaryResponse.success && writeActions.includes(action)) {
      syncToSupabase(data).catch(() => {});
    }

    return primaryResponse;
  } catch (err: any) {
    console.error("Primary Google Apps Script API error:", err);
    return { success: false, message: "Network connection to primary database failed." };
  }
};
