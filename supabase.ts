import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://emnrzkqhxbplkxahvvlg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iu-jlMAbcazlzAVvN2JoeQ_cGNIyryO";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to sanitize strings like Apps Script does
function safeStr(val: any): string {
  return (val !== null && val !== undefined) ? String(val).trim() : "";
}

function safeLower(val: any): string {
  return safeStr(val).toLowerCase();
}

/**
 * Custom Supabase Client Wrapper
 * Intercepts actions from callApi, handles them with sub-second response times using Supabase,
 * and maintains Google Apps Script sheets as a background write-through sync.
 */
export const callSupabase = async (data: any, fallbackCallApi: (d: any) => Promise<any>): Promise<any> => {
  const action = data ? data.action : null;
  if (!action) return { success: false, message: "No action provided" };

  try {
    // ----------------------------------------------------
    // READ ACTIONS (Fetched directly from Supabase in 30ms)
    // ----------------------------------------------------

    if (action === "login") {
      const email = safeLower(data.email);
      const password = safeStr(data.password);

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password);

      if (error) throw error;

      if (users && users.length > 0) {
        const user = users[0];
        return {
          success: true,
          message: "Login successful!",
          email: user.email,
          name: user.name,
          userId: user.user_id,
          joinedDate: user.joined_date
        };
      } else {
        return { success: false, message: "Invalid email or password." };
      }
    }

    else if (action === "getUserList") {
      const { data: users, error } = await supabase
        .from('users')
        .select('email');

      if (error) throw error;
      return {
        success: true,
        data: (users || []).map(u => u.email).filter(Boolean)
      };
    }

    else if (action === "getLedger") {
      const email = safeLower(data.email);
      if (!email) return { success: true, data: [] };

      const { data: txs, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('email', email)
        .order('sl_no', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: (txs || []).map(t => ({
          slNo: t.sl_no,
          date: safeStr(t.date),
          time: safeStr(t.time),
          accountName: safeStr(t.account_name),
          turnover: Number(t.turnover) || 0,
          commission: Number(t.commission) || 0,
          advance: Number(t.advance) || 0,
          penalty: Number(t.penalty) || 0,
          totalPayable: Number(t.total_payable) || 0,
          status: safeStr(t.status),
          dateOfPayment: safeStr(t.date_of_payment)
        }))
      };
    }

    else if (action === "getBankDetails") {
      const email = safeLower(data.email);
      if (!email) return { success: true, data: [] };

      const { data: banks, error } = await supabase
        .from('bank_details')
        .select('*')
        .eq('email', email)
        .order('sl_no', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: (banks || []).map(b => ({
          email: safeStr(b.email),
          slNo: b.sl_no,
          nameOfHolder: safeStr(b.name_of_holder),
          bankName: safeStr(b.bank_name),
          acNo: safeStr(b.ac_no),
          ifscCode: safeStr(b.ifsc_code),
          atmCardNo: safeStr(b.atm_card_no),
          expiry: safeStr(b.expiry),
          cvv: safeStr(b.cvv),
          atmPin: safeStr(b.atm_pin),
          netbankingUserId: safeStr(b.netbanking_user_id),
          netbankingLoginPass: safeStr(b.netbanking_login_pass),
          netbankingTransactionPass: safeStr(b.netbanking_transaction_pass),
          mobileBankingLoginPin: safeStr(b.mobile_banking_login_pin),
          mobileBankingTPin: safeStr(b.mobile_banking_tpin),
          upiPin: safeStr(b.upi_pin),
          remarks: safeStr(b.remarks),
          accountStatus: safeStr(b.account_status) || "ACTIVE"
        }))
      };
    }

    else if (action === "getCheques") {
      const email = safeLower(data.email);
      if (!email) return { success: true, data: [] };

      const { data: cheques, error } = await supabase
        .from('cheques')
        .select('*')
        .eq('email', email)
        .order('sl_no', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: (cheques || []).map(c => ({
          email: safeStr(c.email),
          slNo: c.sl_no,
          date: safeStr(c.date),
          time: safeStr(c.time),
          payTo: safeStr(c.pay_to),
          bankBreakdown: safeStr(c.bank_breakdown),
          statusNotes: safeStr(c.status_notes),
          amountWords: safeStr(c.amount_words),
          amountNumeric: safeStr(c.amount_numeric),
          micrCode: safeStr(c.micr_code)
        }))
      };
    }

    else if (action === "getAdvances") {
      const email = safeLower(data.email);
      if (!email) return { success: true, data: [] };

      const { data: advances, error } = await supabase
        .from('advances')
        .select('*')
        .eq('email', email)
        .order('sl_no', { ascending: false }); // Apps script does reverse()

      if (error) throw error;

      return {
        success: true,
        data: (advances || []).map(a => ({
          email: safeStr(a.email),
          slNo: a.sl_no,
          date: safeStr(a.date),
          time: safeStr(a.time),
          odUserId: safeStr(a.od_user_id),
          bankName: safeStr(a.bank_name),
          totalTurnover: safeStr(a.total_turnover),
          requestedAmount: safeStr(a.requested_amount),
          purpose: safeStr(a.purpose),
          claimStatus: safeStr(a.claim_status),
          paymentDate: safeStr(a.payment_date),
          paymentTime: safeStr(a.payment_time),
          paymentUtr: safeStr(a.payment_utr),
          rejectionReason: safeStr(a.rejection_reason)
        }))
      };
    }

    else if (action === "getComplaints") {
      const email = safeLower(data.email);
      if (!email) return { success: true, data: [] };

      const { data: complaints, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('email', email)
        .order('sl_no', { ascending: false }); // Apps script does reverse()

      if (error) throw error;

      return {
        success: true,
        data: (complaints || []).map(c => ({
          email: safeStr(c.email),
          ticketId: safeStr(c.ticket_id),
          slNo: c.sl_no,
          date: safeStr(c.date),
          time: safeStr(c.time),
          odUserId: safeStr(c.od_user_id),
          subject: safeStr(c.subject),
          description: safeStr(c.description),
          status: safeStr(c.status),
          adminReply: safeStr(c.admin_reply),
          replyDateTime: safeStr(c.reply_date_time)
        }))
      };
    }

    else if (action === "getReferrals") {
      const email = safeLower(data.email);
      if (!email) return { success: true, data: [] };

      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('email', email)
        .order('sl_no', { ascending: false }); // Apps script does reverse()

      if (error) throw error;

      return {
        success: true,
        data: (referrals || []).map(r => ({
          email: safeStr(r.email),
          slNo: r.sl_no,
          date: safeStr(r.date),
          time: safeStr(r.time),
          odUserId: safeStr(r.od_user_id),
          referralName: safeStr(r.referral_name),
          referralTier: safeStr(r.referral_tier),
          registeredGmail: safeStr(r.registered_gmail),
          reason: safeStr(r.reason),
          status: safeStr(r.status) || "PENDING",
          refStatus: safeStr(r.ref_status) || "INACTIVE"
        }))
      };
    }

    else if (action === "getKyc") {
      const email = safeLower(data.email);
      if (!email) return { success: true, data: null };

      const { data: kycs, error } = await supabase
        .from('kyc')
        .select('*')
        .eq('email', email);

      if (error) throw error;

      if (kycs && kycs.length > 0) {
        const k = kycs[0];
        return {
          success: true,
          data: {
            email: safeStr(k.email),
            date: safeStr(k.date),
            time: safeStr(k.time),
            userId: safeStr(k.user_id),
            fullName: safeStr(k.full_name),
            phoneNumber: safeStr(k.phone_number),
            aadharNumber: safeStr(k.aadhar_number),
            panNumber: safeStr(k.pan_number),
            fatherName: safeStr(k.father_name),
            motherName: safeStr(k.mother_name),
            state: safeStr(k.state),
            district: safeStr(k.district),
            cityVillage: safeStr(k.city_village),
            street: safeStr(k.street),
            houseNameNo: safeStr(k.house_name_no),
            landmark: safeStr(k.landmark),
            pinCode: safeStr(k.pin_code),
            bankHolderName: safeStr(k.bank_holder_name),
            bankAcNo: safeStr(k.bank_ac_no),
            bankIfsc: safeStr(k.bank_ifsc),
            status: safeStr(k.status) || "PENDING",
            rejectionReason: safeStr(k.rejection_reason)
          }
        };
      } else {
        return { success: true, data: null };
      }
    }

    else if (action === "getIdCard") {
      const email = safeLower(data.email);
      if (!email) return { success: true, data: null, upline: "NA" };

      // Get ID Card
      const { data: idcards, error } = await supabase
        .from('id_cards')
        .select('*')
        .eq('email', email);

      if (error) throw error;

      let foundRecord = null;
      if (idcards && idcards.length > 0) {
        const idc = idcards[0];
        foundRecord = {
          email: safeStr(idc.email),
          idNo: safeStr(idc.id_no),
          photo: safeStr(idc.photo),
          joiningDate: safeStr(idc.joining_date),
          leavingDate: safeStr(idc.leaving_date),
          dob: safeStr(idc.dob),
          designation: safeStr(idc.designation),
          city: safeStr(idc.city),
          district: safeStr(idc.district),
          state: safeStr(idc.state),
          pinCode: safeStr(idc.pin_code)
        };
      }

      // Compute upline
      let upline = "NA";
      const { data: refs, error: refError } = await supabase
        .from('referrals')
        .select('*')
        .eq('registered_gmail', email);

      if (!refError && refs && refs.length > 0) {
        const uplineEmail = safeLower(refs[0].email);
        const { data: uplineUsers, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', uplineEmail);

        if (!userError && uplineUsers && uplineUsers.length > 0) {
          upline = `${safeStr(uplineUsers[0].name)} (${safeStr(uplineUsers[0].user_id)})`;
        } else {
          upline = uplineEmail;
        }
      }

      return {
        success: true,
        data: foundRecord,
        upline: upline
      };
    }

    else if (action === "getCouriers") {
      const email = safeLower(data.email);
      let query = supabase.from('couriers').select('*');
      if (email !== "all") {
        query = query.eq('email', email);
      }
      const { data: couriers, error } = await query.order('id', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: (couriers || []).map(c => ({
          email: safeStr(c.email),
          slNo: c.sl_no,
          batchNo: safeStr(c.batch_no),
          departureDate: safeStr(c.departure_date),
          departuredBy: safeStr(c.departured_by),
          simType: safeStr(c.sim_type),
          simNo: safeStr(c.sim_no),
          totalAc: safeStr(c.total_ac),
          atmCards: safeStr(c.atm_cards),
          registeredGmail: safeStr(c.registered_gmail),
          gmailPass: safeStr(c.gmail_pass),
          platform: safeStr(c.platform),
          trackingNo: safeStr(c.tracking_no),
          receiverPhone: safeStr(c.receiver_phone),
          dispatchingPinCode: safeStr(c.dispatching_pin_code),
          address: safeStr(c.address),
          receivedBy: safeStr(c.received_by),
          receivingDate: safeStr(c.receiving_date),
          receivingPinCode: safeStr(c.receiving_pin_code),
          receivingAddress: safeStr(c.receiving_address),
          batchReceivedStatus: safeStr(c.batch_received_status) || "PENDING",
          batchReturnedDate: safeStr(c.batch_returned_date),
          batchReturnedUserConfirmed: safeStr(c.batch_returned_user_confirmed)
        }))
      };
    }

    else if (action === "getAdminStats") {
      const { count: activeMembers, error: uErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (uErr) throw uErr;

      const { data: txs, error: tErr } = await supabase
        .from('transactions')
        .select('turnover, status');

      if (tErr) throw tErr;

      let totalWelfareFund = 0;
      let paidCount = 0;
      let totalCount = txs ? txs.length : 0;

      if (txs) {
        for (const t of txs) {
          const status = safeStr(t.status).toUpperCase();
          const amt = Number(t.turnover) || 0;
          if (status === "PAID") {
            totalWelfareFund += amt;
            paidCount++;
          }
        }
      }

      const rate = totalCount > 0 ? ((paidCount / totalCount) * 100) : 100.0;

      return {
        success: true,
        activeMembers: activeMembers || 0,
        totalWelfareFund: totalWelfareFund,
        clearingRate: rate.toFixed(1) + "%"
      };
    }

    else if (action === "searchUserByEmail") {
      const searchEmail = safeLower(data.searchEmail);
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', searchEmail);

      if (uErr) throw uErr;

      if (users && users.length > 0) {
        const foundUser = users[0];
        let userRefTier = "FIRST CHAIN (2.5%)";
        let userRefStatus = "ACTIVE";

        const { data: refs, error: rErr } = await supabase
          .from('referrals')
          .select('referral_tier, ref_status')
          .eq('registered_gmail', searchEmail);

        if (!rErr && refs && refs.length > 0) {
          userRefTier = safeStr(refs[0].referral_tier) || userRefTier;
          userRefStatus = safeStr(refs[0].ref_status) || userRefStatus;
        }

        return {
          success: true,
          userData: {
            userId: foundUser.user_id,
            name: foundUser.name,
            email: foundUser.email,
            joinedDate: foundUser.joined_date,
            tier: userRefTier,
            status: userRefStatus
          }
        };
      } else {
        return { success: false, message: "No user found with Gmail ID: " + searchEmail };
      }
    }

    // ----------------------------------------------------
    // WRITE ACTIONS (Dual-write to Supabase AND Apps Script)
    // ----------------------------------------------------

    let writeResponse: any = { success: false };

    if (action === "signup") {
      const email = safeLower(data.email);
      const password = safeStr(data.password);
      const name = safeStr(data.name);

      // Check existence
      const { data: exists, error: checkErr } = await supabase
        .from('users')
        .select('email')
        .eq('email', email);

      if (checkErr) throw checkErr;
      if (exists && exists.length > 0) {
        return { success: false, message: "Email is already registered!" };
      }

      const userId = "CRWO-" + Math.floor(1000 + Math.random() * 9000);
      const joinedDate = new Date().toLocaleDateString();

      const { error: insErr } = await supabase
        .from('users')
        .insert([{
          user_id: userId,
          email: email,
          password: password,
          name: name,
          joined_date: joinedDate
        }]);

      if (insErr) throw insErr;
      writeResponse = { success: true, message: "Signup successful!", userId };
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

      // Count entries
      const { count, error: countErr } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('email', email);

      if (countErr) throw countErr;
      const slNo = (count || 0) + 1;

      const { error: insErr } = await supabase
        .from('transactions')
        .insert([{
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
        }]);

      if (insErr) throw insErr;
      writeResponse = { success: true, message: "Entry successfully added to " + email };
    }

    else if (action === "updateStatus") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);
      const status = data.status || "PAID";
      const dateOfPayment = data.dateOfPayment || (status === "PAID" ? new Date().toLocaleDateString() : "-");

      const { error: upErr } = await supabase
        .from('transactions')
        .update({ status, date_of_payment: dateOfPayment })
        .eq('email', email)
        .eq('sl_no', slNo);

      if (upErr) throw upErr;
      writeResponse = { success: true, message: "Transaction #" + slNo + " status updated to " + status };
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

      const { count, error: countErr } = await supabase
        .from('bank_details')
        .select('*', { count: 'exact', head: true })
        .eq('email', email);

      if (countErr) throw countErr;
      const serialNum = (count || 0) + 1;

      const { error: insErr } = await supabase
        .from('bank_details')
        .insert([{
          email,
          sl_no: serialNum,
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
          mobile_banking_tpin: mobileBankingTPin,
          upi_pin: upiPin,
          remarks,
          account_status: accountStatus
        }]);

      if (insErr) throw insErr;
      writeResponse = { success: true, message: "Bank Account #" + serialNum + " added successfully for " + email };
    }

    else if (action === "updateBankStatus") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);
      const accountStatus = data.accountStatus || "ACTIVE";

      const { error: upErr } = await supabase
        .from('bank_details')
        .update({ account_status: accountStatus })
        .eq('email', email)
        .eq('sl_no', slNo);

      if (upErr) throw upErr;
      writeResponse = { success: true, message: "Bank account #" + slNo + " status updated to " + accountStatus };
    }

    else if (action === "addCheque") {
      const email = safeLower(data.email);
      const date = data.date || new Date().toLocaleDateString();
      const time = data.time || new Date().toLocaleTimeString();
      const payTo = data.payTo || "";
      const bankBreakdown = data.bankBreakdown || "";
      const statusNotes = data.statusNotes || "";
      const amountWords = data.amountWords || "";
      const amountNumeric = data.amountNumeric || "0.00";
      const micrCode = data.micrCode || "";

      const { count, error: countErr } = await supabase
        .from('cheques')
        .select('*', { count: 'exact', head: true })
        .eq('email', email);

      if (countErr) throw countErr;
      const serialNum = (count || 0) + 1;

      const { error: insErr } = await supabase
        .from('cheques')
        .insert([{
          email,
          sl_no: serialNum,
          date,
          time,
          pay_to: payTo,
          bank_breakdown: bankBreakdown,
          status_notes: statusNotes,
          amount_words: amountWords,
          amount_numeric: amountNumeric,
          micr_code: micrCode
        }]);

      if (insErr) throw insErr;
      writeResponse = { success: true, message: "Digital Cheque #" + serialNum + " issued successfully for " + email };
    }

    else if (action === "addAdvance") {
      const email = safeLower(data.email);
      const date = data.date || new Date().toLocaleDateString();
      const time = data.time || new Date().toLocaleTimeString();
      const odUserId = data.odUserId || data.userId || "CRWO-User";
      const bankName = data.bankName || "";
      const totalTurnover = data.totalTurnover || "0";
      const requestedAmount = data.requestedAmount || "0";
      const purpose = data.purpose || "";

      const { count, error: countErr } = await supabase
        .from('advances')
        .select('*', { count: 'exact', head: true })
        .eq('email', email);

      if (countErr) throw countErr;
      const slNo = (count || 0) + 1;

      const { error: insErr } = await supabase
        .from('advances')
        .insert([{
          email,
          sl_no: slNo,
          date,
          time,
          od_user_id: odUserId,
          bank_name: bankName,
          total_turnover: totalTurnover,
          requested_amount: requestedAmount,
          purpose,
          claim_status: "PENDING"
        }]);

      if (insErr) throw insErr;
      writeResponse = { success: true, message: "Advance request #" + slNo + " submitted successfully." };
    }

    else if (action === "updateAdvance") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);
      const claimStatus = data.claimStatus || "PENDING";
      const paymentDate = data.paymentDate || "";
      const paymentTime = data.paymentTime || "";
      const paymentUtr = data.paymentUtr || "";
      const rejectionReason = data.rejectionReason || "";

      const { error: upErr } = await supabase
        .from('advances')
        .update({
          claim_status: claimStatus,
          payment_date: paymentDate,
          payment_time: paymentTime,
          payment_utr: paymentUtr,
          rejection_reason: rejectionReason
        })
        .eq('email', email)
        .eq('sl_no', slNo);

      if (upErr) throw upErr;
      writeResponse = { success: true, message: "Advance request #" + slNo + " updated successfully." };
    }

    else if (action === "addComplain") {
      const email = safeLower(data.email);
      const date = data.date || new Date().toLocaleDateString();
      const time = data.time || new Date().toLocaleTimeString();
      const odUserId = data.userId || "CRWO-User";
      const subject = data.subject || "HELP/OTHERS";
      const description = data.description || "";

      const { count, error: countErr } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('email', email);

      if (countErr) throw countErr;
      const slNo = (count || 0) + 1;
      const numPadded = slNo < 10 ? ("0" + slNo) : ("" + slNo);
      const ticketId = data.ticketId || (`${odUserId}-${numPadded}`);

      const { error: insErr } = await supabase
        .from('complaints')
        .insert([{
          email,
          ticket_id: ticketId,
          sl_no: slNo,
          date,
          time,
          od_user_id: odUserId,
          subject,
          description,
          status: "PENDING"
        }]);

      if (insErr) throw insErr;
      writeResponse = { success: true, message: "Complaint ticket " + ticketId + " submitted successfully.", ticketId };
    }

    else if (action === "updateComplain") {
      const email = safeLower(data.email);
      const ticketId = safeStr(data.ticketId);
      const status = data.status || "PENDING";
      const adminReply = data.adminReply || "";
      const replyDateTime = data.replyDateTime || (new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString());

      const { error: upErr } = await supabase
        .from('complaints')
        .update({
          status,
          admin_reply: adminReply,
          reply_date_time: replyDateTime
        })
        .eq('email', email)
        .eq('ticket_id', ticketId);

      if (upErr) throw upErr;
      writeResponse = { success: true, message: "Ticket " + ticketId + " updated successfully." };
    }

    else if (action === "addReferral") {
      const email = safeLower(data.email);
      const date = data.date || new Date().toLocaleDateString();
      const time = data.time || new Date().toLocaleTimeString();
      const odUserId = data.userId || "CRWO-User";
      const referralName = data.referralName || "";
      const referralTier = data.referralTier || "FIRST CHAIN (2.5%)";
      const registeredGmail = safeLower(data.registeredGmail);
      const reason = data.reason || "";

      const { count, error: countErr } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('email', email);

      if (countErr) throw countErr;
      const slNo = (count || 0) + 1;

      const { error: insErr } = await supabase
        .from('referrals')
        .insert([{
          email,
          sl_no: slNo,
          date,
          time,
          od_user_id: odUserId,
          referral_name: referralName,
          referral_tier: referralTier,
          registered_gmail: registeredGmail,
          reason,
          status: "PENDING",
          ref_status: "INACTIVE"
        }]);

      if (insErr) throw insErr;
      writeResponse = { success: true, message: "Referral request #" + slNo + " submitted successfully." };
    }

    else if (action === "updateReferral") {
      const email = safeLower(data.email);
      const slNo = parseInt(data.slNo);
      const status = data.status || "PENDING";
      const refStatus = data.refStatus || "INACTIVE";

      const { error: upErr } = await supabase
        .from('referrals')
        .update({
          status,
          ref_status: refStatus
        })
        .eq('email', email)
        .eq('sl_no', slNo);

      if (upErr) throw upErr;
      writeResponse = { success: true, message: "Referral request #" + slNo + " updated successfully." };
    }

    else if (action === "addKyc") {
      const email = safeLower(data.email);
      const date = data.date || new Date().toLocaleDateString();
      const time = data.time || new Date().toLocaleTimeString();
      const userId = data.userId || "CRWO-User";
      const fullName = data.fullName || "";
      const phoneNumber = data.phoneNumber || "";
      const aadharNumber = data.aadharNumber || "";
      const panNumber = data.panNumber || "";
      const fatherName = data.fatherName || "";
      const motherName = data.motherName || "";
      const state = data.state || "";
      const district = data.district || "";
      const cityVillage = data.cityVillage || "";
      const street = data.street || "";
      const houseNameNo = data.houseNameNo || "";
      const landmark = data.landmark || "";
      const pinCode = data.pinCode || "";
      const bankHolderName = data.bankHolderName || "";
      const bankAcNo = data.bankAcNo || "";
      const bankIfsc = data.bankIfsc || "";

      // Upsert KYC
      const { error: upsErr } = await supabase
        .from('kyc')
        .upsert({
          email,
          date,
          time,
          user_id: userId,
          full_name: fullName,
          phone_number: phoneNumber,
          aadhar_number: aadharNumber,
          pan_number: panNumber,
          father_name: fatherName,
          mother_name: motherName,
          state,
          district,
          city_village: cityVillage,
          street,
          house_name_no: houseNameNo,
          landmark,
          pin_code: pinCode,
          bank_holder_name: bankHolderName,
          bank_ac_no: bankAcNo,
          bank_ifsc: bankIfsc,
          status: "PENDING",
          rejection_reason: ""
        });

      if (upsErr) throw upsErr;
      writeResponse = { success: true, message: "KYC details submitted successfully." };
    }

    else if (action === "updateKyc") {
      const email = safeLower(data.email);
      const status = data.status || "PENDING";
      const rejectionReason = data.rejectionReason || "";

      const { error: upErr } = await supabase
        .from('kyc')
        .update({
          status,
          rejection_reason: rejectionReason
        })
        .eq('email', email);

      if (upErr) throw upErr;
      writeResponse = { success: true, message: "KYC status updated successfully to " + status };
    }

    else if (action === "addIdCard") {
      const email = safeLower(data.email);
      const idNo = safeStr(data.idNo);
      const photo = safeStr(data.photo);
      const joiningDate = safeStr(data.joiningDate);
      const leavingDate = safeStr(data.leavingDate);
      const dob = safeStr(data.dob);
      const designation = safeStr(data.designation);
      const city = safeStr(data.city);
      const district = safeStr(data.district);
      const state = safeStr(data.state);
      const pinCode = safeStr(data.pinCode);

      const { error: upsErr } = await supabase
        .from('id_cards')
        .upsert({
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
        });

      if (upsErr) throw upsErr;
      writeResponse = { success: true, message: "ID Card details updated successfully." };
    }

    else if (action === "addCourier") {
      const email = safeLower(data.email);
      const departureDate = data.departureDate || new Date().toLocaleDateString();
      const departuredBy = data.departuredBy || "";
      const simType = data.simType || "JIO";
      const simNo = data.simNo || "";
      const totalAc = data.totalAc || "1";
      const atmCards = data.atmCards || "1";
      const registeredGmail = data.registeredGmail || "";
      const gmailPass = data.gmailPass || "";
      const platform = data.platform || "SPEEDPOST";
      const trackingNo = data.trackingNo || "";
      const receiverPhone = data.receiverPhone || "";
      const dispatchingPinCode = data.dispatchingPinCode || "";
      const address = data.address || "";

      // Get userId
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', email);

      if (uErr) throw uErr;
      const userUserId = users && users.length > 0 ? users[0].user_id : "CRWO-4567";

      // Count entries
      const { count, error: countErr } = await supabase
        .from('couriers')
        .select('*', { count: 'exact', head: true })
        .eq('email', email);

      if (countErr) throw countErr;
      const slNo = (count || 0) + 1;
      const numPadded = slNo < 10 ? ("00" + slNo) : (slNo < 100 ? ("0" + slNo) : ("" + slNo));
      const batchNo = data.batchNo || (`${userUserId}-${numPadded}`);

      const { error: insErr } = await supabase
        .from('couriers')
        .insert([{
          email,
          sl_no: slNo,
          batch_no: batchNo,
          departure_date: departureDate,
          departured_by: departuredBy,
          sim_type: simType,
          sim_no: simNo,
          total_ac: totalAc,
          atm_cards: atmCards,
          registered_gmail: registeredGmail,
          gmail_pass: gmailPass,
          platform,
          tracking_no: trackingNo,
          receiver_phone: receiverPhone,
          dispatching_pin_code: dispatchingPinCode,
          address,
          batch_received_status: "PENDING"
        }]);

      if (insErr) throw insErr;
      writeResponse = { success: true, message: "Courier Batch " + batchNo + " dispatched successfully!", batchNo };
    }

    else if (action === "updateCourierAdmin") {
      const email = safeLower(data.email);
      const batchNo = safeStr(data.batchNo);
      const receivedBy = data.receivedBy || "";
      const receivingDate = data.receivingDate || new Date().toLocaleDateString();
      const receivingPinCode = data.receivingPinCode || "";
      const receivingAddress = data.receivingAddress || "";
      const batchReceivedStatus = data.batchReceivedStatus || "RECEIVED";
      const batchReturnedDate = data.batchReturnedDate || "";

      const { error: upErr } = await supabase
        .from('couriers')
        .update({
          received_by: receivedBy,
          receiving_date: receivingDate,
          receiving_pin_code: receivingPinCode,
          receiving_address: receivingAddress,
          batch_received_status: batchReceivedStatus,
          batch_returned_date: batchReturnedDate
        })
        .eq('email', email)
        .eq('batch_no', batchNo);

      if (upErr) throw upErr;
      writeResponse = { success: true, message: "Batch " + batchNo + " status updated successfully to " + batchReceivedStatus };
    }

    else if (action === "updateCourierUserConfirm") {
      const email = safeLower(data.email);
      const batchNo = safeStr(data.batchNo);
      const confirmStatus = data.confirmStatus || "CONFIRMED";

      const { error: upErr } = await supabase
        .from('couriers')
        .update({
          batch_returned_user_confirmed: confirmStatus
        })
        .eq('email', email)
        .eq('batch_no', batchNo);

      if (upErr) throw upErr;
      writeResponse = { success: true, message: "Batch " + batchNo + " receipt confirmed by user!" };
    }

    // Run Google Apps Script background write for sync compatibility
    fallbackCallApi(data).catch(err => {
      console.warn("GAS background sync failed:", err);
    });

    return writeResponse;

  } catch (err: any) {
    console.error("Supabase API Intercept error:", err);
    // In case of error in Supabase, fall back to Google Apps Script completely
    return await fallbackCallApi(data);
  }
};
