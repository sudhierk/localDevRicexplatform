/* global getAssetRegistry getFactory emit */

/**
 * @param {org.ricex.net.txCreate} tx - Trade Create
 * @transaction
 */
async function CreateTrade(tx) {
    const tradeRegistry = await getAssetRegistry('org.ricex.net.Trade');
    var trade = getFactory().newResource('org.ricex.net', 'Trade', tx.tradeId);
    trade.requestType = tx.requestType;
    trade.validTime = tx.validTime;
    trade.owner = tx.owner;
    trade.state = 'DEAL';
    trade.counterparty = tx.counterparty;
    trade.incoterm = tx.incoterm;

    let res = await tradeRegistry.add(trade);

    await auditLog(tx.transactionId, trade, "trade.created@" + tx.tradeId, tx.owner, tx.author, tx.timestamp);
    await auditLog(tx.transactionId + '-1', trade, "trade.contract.created", tx.owner, tx.author, tx.timestamp);
}

/**
 * @param {org.ricex.net.txSign} tx - Trade Sign
 * @transaction
 */
async function SignTrade(tx) {

    if (tx.trade.state !== 'DEAL') {
        throw new Error('Invalid state:' + tx.trade.state);
    }

    if (tx.trade.owner.getIdentifier() === tx.participant.getIdentifier()) {
        tx.trade.signOwner = true;
        await auditLog(tx.transactionId, tx.trade, "trade.sign@owner", tx.participant, tx.author, tx.timestamp);
    } else if (tx.trade.counterparty.getIdentifier() === tx.participant.getIdentifier()) {
        tx.trade.signCounterparty = true;
        await auditLog(tx.transactionId, tx.trade, "trade.sign@counterparty", tx.participant, tx.author, tx.timestamp);
    }else{
      throw new Error('User is not a participant:' + tx.participant.getIdentifier());
    }

    if (tx.trade.signOwner && tx.trade.signCounterparty) {
        tx.trade.state = 'SIGNED';
        await auditLog(tx.transactionId + "-1", tx.trade, "trade.signed", tx.participant, tx.author, tx.timestamp);
    }

    const tradeRegistry = await getAssetRegistry('org.ricex.net.Trade');
    await tradeRegistry.update(tx.trade);
}

/**
 * @param {org.ricex.net.txVessel} tx - Trade Vessel
 * @transaction
 */
async function Vessel(tx) {
    if (tx.trade.state !== 'SIGNED') {
        throw new Error('Invalid state:' + tx.trade.state);
    }

    if (tx.trade.incoterm === "FOB"){
      if(tx.trade.requestType === "BUY"){
        if(tx.trade.owner.getIdentifier() === tx.participant.getIdentifier()){
          tx.trade.vesselNominated = true;
          await auditLog(tx.transactionId, tx.trade, "trade.vesselNominated@owner", tx.participant, tx.author, tx.timestamp);
        } else if (tx.trade.counterparty.getIdentifier() === tx.participant.getIdentifier()){
          tx.trade.vesselAccepted = true;
          await auditLog(tx.transactionId, tx.trade, "trade.vesselAccepted@owner", tx.participant, tx.author, tx.timestamp);
        }
      }else {
        if(tx.trade.owner.getIdentifier() === tx.participant.getIdentifier()){
          tx.trade.vesselAccepted = true;
          await auditLog(tx.transactionId, tx.trade, "trade.vesselAccepted@owner", tx.participant, tx.author, tx.timestamp);
        } else if (tx.trade.counterparty.getIdentifier() === tx.participant.getIdentifier()){
          tx.trade.vesselNominated = true;
          await auditLog(tx.transactionId, tx.trade, "trade.vesselNominated@owner", tx.participant, tx.author, tx.timestamp);
        }else{
          throw new Error('Wrong participant', tx.participant.getIdentifier());
        }
      }

    } else if (tx.trade.incoterm === "CIF"){
      if(tx.trade.requestType === "BUY"){
        if (tx.trade.counterparty.getIdentifier() === tx.participant.getIdentifier()){
          await auditLog(tx.transactionId, tx.trade, "trade.vesselNominated@owner", tx.participant, tx.author, tx.timestamp);
          tx.trade.vesselNominated = true;
          tx.trade.vesselAccepted = true;
        }else {
          throw new Error('Only seller needs to vessel nomination for CIF incoterm ' + tx.trade.tyrequestType + " " + tx.trade.counterparty.getIdentifier() + " " + tx.participant.getIdentifier());
        }
      }else {
        if (tx.trade.owner.getIdentifier() === tx.participant.getIdentifier()){
          await auditLog(tx.transactionId, tx.trade, "trade.vesselNominated@owner", tx.participant, tx.author, tx.timestamp);
          tx.trade.vesselNominated = true;
          tx.trade.vesselAccepted = true;
        }else{
          throw new Error('Only seller needs to vessel nomination for CIF incoterm' + tx.trade.tyrequestType + " " + tx.trade.counterparty.getIdentifier() + " " + tx.participant.getIdentifier());
        }
      }
    }else{
      throw new Error('Wrong incoterm' + tx.trade.incoterm);
    }

    if(tx.trade.vesselNominated && tx.trade.vesselAccepted){
      tx.trade.state = 'VESSEL_NOMINATED';
      await auditLog(tx.transactionId + "-1", tx.trade, "trade.vesselNominatedComplete@owner", tx.participant, tx.author, tx.timestamp);
    }

    const tradeRegistry = await getAssetRegistry('org.ricex.net.Trade');
    await tradeRegistry.update(tx.trade)
}

/**
 * @param {org.ricex.net.txRejectVessel} tx - Reject vessel
 * @transaction
 */
async function RejectVessel(tx) {
    await auditLog(tx.transactionId, tx.trade, "trade.vesselRejected@owner", tx.participant, tx.author, tx.timestamp);
}

/**
 * @param {org.ricex.net.txCreateShipments} tx - Shipment Create
 * @transaction
 */
async function CreateShipments(tx) {

    if (tx.trade.state !== 'VESSEL_NOMINATED') {
        throw new Error('Invalid state:' + tx.trade.state);
    }

    var shipments = JSON.parse(tx.shipments);

    //TODO check sum of all items and trade amount
    for (let shipmentObj of shipments) {
      const shipmentRegistry = await getAssetRegistry('org.ricex.net.Shipment');
      var shipment = getFactory().newResource('org.ricex.net', 'Shipment', shipmentObj.shipmentId);
      shipment.tradeId = tx.trade.tradeId;
      shipment.shipmentId = shipmentObj.shipmentId;
      shipment.amount = shipmentObj.amount;
      if (shipmentObj.incoterm == 'FOB') {
          shipment.insurCertID = true;
      }

      let res = await shipmentRegistry.add(shipment);

      await auditLog(tx.transactionId, tx.trade, "shipment.created@" + shipmentObj.shipmentId, tx.participant, tx.author, tx.timestamp);
    }

    tx.trade.state = 'INSTRUCTIONS';
    const tradeRegistry = await getAssetRegistry('org.ricex.net.Trade');
    await tradeRegistry.update(tx.trade);

    await auditLog(tx.transactionId + '-1', tx.trade, "trade.instructions", tx.participant, tx.author, tx.timestamp);
}

/**
 * @param {org.ricex.net.txAdvice} tx - Trade Sent Advice
 * @transaction
 */
async function Advice(tx) {
    if (tx.trade.state !== 'INSTRUCTIONS') {
        throw new Error('Invalid state:' + tx.trade.state);
    }

    //TODO check if all shipments filled by documents
    tx.trade.state = 'ADVICE';

    await auditLog(tx.transactionId, tx.trade, "trade.advice", tx.participant, tx.author, tx.timestamp);

    const tradeRegistry = await getAssetRegistry('org.ricex.net.Trade');
    await tradeRegistry.update(tx.trade);
}

/**
 * @param {org.ricex.net.txUploadDocument} tx - Upload document
 * @transaction
 */
async function UploadDocument(tx) {

    switch (tx.type) {
        case "BILL":
            tx.shipment.billID = true;
            break;
        case "INVOICE":
            tx.trade.invoice = true;
            const tradeRegistry = await getAssetRegistry('org.ricex.net.Trade');
            await tradeRegistry.update(tx.trade);
            await auditLog(tx.transactionId, tx.trade, "trade.document.invoice@"+ tx.sha256, tx.participant, tx.author, tx.timestamp);
            return;
            break;
        case "CERT_OF_QUALITY":
            tx.shipment.qualityCertID = true;
            break;
        case "QUALITY_APPEARANCE_CERT":
            tx.shipment.qualAppCertID = true;
            break;
        case "CERT_OF_WEIGHT":
            tx.shipment.weightCertID = true;
            break;
        case "CERT_OF_PACKING":
            tx.shipment.packCertID = true;
            break;
        case "CERT_OF_FUMIGATION":
            tx.shipment.fumigCertID = true;
            break;
        case "PHYTOSANITARY":
            tx.shipment.phytoCertID = true;
            break;
        case "NON_GMO":
            tx.shipment.gmoCertID = true;
            break;
        case "EXPORT_DECLARATION":
            tx.shipment.exportDecID = true;
            break;
        case "INSURANCE":
            tx.shipment.insurCertID = true;
            break;
        default:
            throw new Error('Invalid doc type:' + tx.document);
    }

    const documentRegistry = await getAssetRegistry('org.ricex.net.Document');
    try{
      var document = await documentRegistry.get(tx.documentId);
      document.sha256 = tx.sha256;
      let res = await documentRegistry.update(document);
      console.log("document update res", res);
    }catch(e){
      var document = getFactory().newResource('org.ricex.net', 'Document', tx.documentId);
      document.sha256 = tx.sha256;
      document.type = tx.type;
      document.shipmentId = tx.shipment.shipmentId;
      let res = await documentRegistry.add(document);
      console.log("document save res", res);
    }

    await auditLog(tx.transactionId, tx.trade, "trade.document.upload@" + tx.type + "@" + document.shipmentId + "@" + tx.sha256, tx.participant, tx.author, tx.timestamp);

    const shipmentRegistry = await getAssetRegistry('org.ricex.net.Shipment');
    await shipmentRegistry.update(tx.shipment);
}

/**
 * Issue commercial paper
 *
 * @param {String} issuer commercial paper issuer
 */
async function testIssue(issuer) {
    return issuer + "test"
}

/**
 * @param {org.ricex.net.txApproveDocument} tx - Approve document
 * @transaction
 */
async function ApproveDocument(tx) {
    await auditLog(tx.transactionId, tx.trade, "trade.document.approve@" + tx.type + "@" + tx.shipment.shipmentId, tx.participant, tx.author, tx.timestamp);
}

/**
 * @param {org.ricex.net.txRejectDocument} tx - Reject document
 * @transaction
 */
async function RejectDocument(tx) {
    await auditLog(tx.transactionId, tx.trade, "trade.document.reject@" + tx.type + "@" + tx.shipment.shipmentId, tx.participant, tx.author, tx.timestamp);
}

/**
 * @param {org.ricex.net.txReleaseForBuyerDocument} tx - Release for Buyer document
 * @transaction
 */
async function ReleaseForBuyerDocument(tx) {
    await auditLog(tx.transactionId, tx.trade, "trade.document.releaseForBuyer@" + tx.type + "@" + tx.shipment.shipmentId, tx.participant, tx.author, tx.timestamp);
}

/**
 * @param {org.ricex.net.txConfirmDocument} tx - Confirm Documents
 * @transaction
 */
async function ConfirmDocument(tx) {
    tx.trade.state = 'DOCUMENTS';
    await auditLog(tx.transactionId, tx.trade, "trade.confirmDocuments", tx.participant, tx.author, tx.timestamp);

    const tradeRegistry = await getAssetRegistry('org.ricex.net.Trade');
    await tradeRegistry.update(tx.trade);
}

/**
 * @param {org.ricex.net.txPayment} tx - Process payment
 * @transaction
 */
async function Payment(tx) {
    if (tx.trade.state !== 'DOCUMENTS') {
        throw new Error('Invalid state:' + tx.trade.state);
    }

    tx.trade.state = 'PAYMENT';
    await auditLog(tx.transactionId, tx.trade, "trade.payment", tx.participant, tx.author, tx.timestamp);

    const tradeRegistry = await getAssetRegistry('org.ricex.net.Trade');
    await tradeRegistry.update(tx.trade);
}

/**
 * @param {org.ricex.net.txAcceptPayment} tx - Accept payment
 * @transaction
 */
async function AcceptPayment(tx) {
    if (tx.trade.state !== 'PAYMENT') {
        throw new Error('Invalid state:' + tx.trade.state);
    }

    tx.trade.state = 'PAYED';
    await auditLog(tx.transactionId, tx.trade, "trade.acceptPayment", tx.participant, tx.author, tx.timestamp);
    tx.trade.Completion = tx.timestamp;

    const tradeRegistry = await getAssetRegistry('org.ricex.net.Trade');
    await tradeRegistry.update(tx.trade);
}

/**
 * @param {org.ricex.net.txClose} tx - Trade Closed
 * @transaction
 */
async function CloseTrade(tx) {
    if (tx.trade.state !== 'PAYED') {
        throw new Error('Invalid state:' + tx.trade.state);
    }

    if (tx.trade.owner.getIdentifier() === tx.participant.getIdentifier()) {
        tx.trade.closedOwner = true;
        await auditLog(tx.transactionId, tx.trade, "trade.close@owner", tx.participant, tx.author, tx.timestamp);
    } else if (tx.trade.counterparty.getIdentifier() === tx.participant.getIdentifier()) {
        tx.trade.closedCounterparty = true;
        await auditLog(tx.transactionId, tx.trade, "trade.close@counterparty", tx.participant, tx.author, tx.timestamp);
    }

    if (tx.trade.closedOwner && tx.trade.closedCounterparty) {
        tx.trade.state = 'CLOSED';
        await auditLog(tx.transactionId + "-1", tx.trade, "trade.closed", tx.participant, tx.author, tx.timestamp);
    }

    const tradeRegistry = await getAssetRegistry('org.ricex.net.Trade');
    await tradeRegistry.update(tx.trade);
}

function verifyDocuments(shipment) {
    return shipment.billID
        && shipment.invoiceID
        && shipment.qualityCertID
        && shipment.qualAppCertID
        && shipment.weightCertID
        && shipment.packCertID
        && shipment.fumigCertID
        && shipment.phytoCertID
        && shipment.gmoCertID
        && shipment.fumigCertID
        && shipment.insurCertID;
}

async function auditLog(id, trade, comment, company, author, date) {
    var history = getFactory().newResource('org.ricex.net', 'History', id);
    history.comment = comment;
    history.company = company.getIdentifier();
    history.companyName = company.name;
    history.author = author;
    history.date = date;
    history.trade = trade.getIdentifier();
    const historyRegistry = await getAssetRegistry('org.ricex.net.History');
    await historyRegistry.add(history);
}
