import React, { Component } from 'react';
import FaFilePdfO from 'react-icons/lib/fa/file-pdf-o';
import moment from 'moment';
import { EnumsService } from '../../../../services/service.utils';
import html2pdf from 'html2pdf.js';
import { DATEFORMAT } from '../../../../services/service.values';
import AccessControl, { INSPECTION_COMPANY } from '../../../components/AccessControl';

var converter = require('number-to-words');
const Countries = EnumsService.countries();

class SmartContract extends Component {
    state = {
        marginTop: 0,
        marginRight: 0,
        marginBot: 0,
        marginLeft: 0
    };
    handleExport = () => {
        let options = {
            margin: [6, 15, 6, 15],
            filename: `${this.props.trade.incoterm} PURCHASE CONTRACT ${this.props.trade.id}.pdf`,
            html2canvas: {scale: 3},
            jsPDF: {unit: 'mm', format: 'a4', orientation: 'portrait'}
        };
        html2pdf()
            .from(document.getElementById('inner-capture'))
            .set(options)
            .save();

        // let doc = new jsPDF();
        // let specialElementHandlers = {
        //   "#editor": function(element, renderer) {
        //     return true;
        //   }
        // };
        // doc.fromHTML($("#capture").html(), 15, 15, {
        //   width: 170,
        //   elementHandlers: specialElementHandlers
        // });
        // doc.save(`${this.props.trade.Incoterm} PURCHASE CONTRACT ${this.props.trade.ID}.pdf`);
        // var prtContent = document.getElementById("capture");
        // var WinPrint = window.open("", "", "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0");
        // WinPrint.document.write(prtContent.innerHTML);
        // WinPrint.document.close();
        // WinPrint.focus();
        // WinPrint.print();
        // WinPrint.close();
    };

    renderContract() {
        const {trade, info} = this.props;
        const GAFTA_CIF_CONTRACT_NO = '122 ';
        const GAFTA_FOB_CONTRACT_NO = '120 ';
        return (
            <div className="trades-dtls__contract">
                <div className="row justify-content-end">
                    <FaFilePdfO className="trades-dtls__contract-export-img"/>
                    <span className="trades-dtls__contract-export" onClick={this.handleExport}>
                        Export PDF
                    </span>
                </div>
                <div className="trades-dtls__contract-area" id="capture">
                    <div id="inner-capture">
                        <span className="trades-dtls__contract-date">{moment().format(DATEFORMAT)}</span>
                        <h4 className="trades-dtls__contract-heading">
                            {trade.incoterm} Purchase contract ID {trade.id}
                        </h4>
                        <span className="trades-dtls__contract-item">1. Seller</span>
                        <p className="trades-dtls__contract-text">
                            {trade.seller}
                            <br/>
                            {`${info.sellerAddress1} ${Countries[trade.sellerCountry]}`}
                        </p>
                        <span className="trades-dtls__contract-item">2. Buyer</span>
                        <p className="trades-dtls__contract-text">
                            {trade.buyer}
                            <br/>
                            {`${info.buyerAddress1} ${Countries[trade.buyerCountry]}`}
                        </p>
                        <span className="trades-dtls__contract-item">3. Product and Specifications</span>
                        <p className="trades-dtls__contract-text">
                            {trade.riceType}, {trade.cropYear}, {trade.quality}.
                            <br/>
                            Quality and appearance to be equal or better than the sealed sample, which seller has to
                            rush to{` ${
                            trade.inspectionName
                            } `}
                            for approval.<br/>
                            Rice to be of sound loyal and merchantable quality, free from foreign and /or bad odor, free
                            from live
                            weevils/live insects and practically free of dead weevils, fit for direct human consumption.
                            Otherwise as
                            per
                            {` ${Countries[trade.origin]}`} export standards valid at time of shipment.<br/>
                            The {trade.inspectionName} sealed sample to be send to Buyer for approval of quality and
                            appearance. Once the
                            same approved, the said sealed sample will serve as a reference of the quality and
                            appearance of rice to
                            be delivered under this contact.<br/>
                        </p>
                        <span className="trades-dtls__contract-item">4. Quality</span>
                        <p className="trades-dtls__contract-text">
                            Quality, weight, packing, fumigation and condition shall be determined, at time of loading,
                            by{` ${
                            trade.inspectionName
                            } `}
                            appointed by Buyer for Seller's account ("contractual appointed surveyor"). The Buyer shall
                            have the right
                            to appoint a second surveyor ("second appointed surveyor") to check the goods prior to and
                            at the time of
                            loading, in which case the Seller will give full access to the goods. Costs of second
                            appointed surveyor
                            to be for Buyer's account. In case of dispute, the findings of the contractual appointed
                            surveyor per its
                            certificates to prevail and to be final and binding on both parties.
                        </p>
                        <span className="trades-dtls__contract-item">5. Quantity</span>
                        <p className="trades-dtls__contract-text">
                            {trade.measure} ({trade.measure && converter.toWords(trade.measure)}) {trade.measurement === 'TONS' ? 'tons' : 'cwt'},
                            5 pct.
                            more or less in option of Buyer and at contract price. Exact quantity to be declared at time
                            of nomination
                            vessel.
                        </p>
                        <span className="trades-dtls__contract-item">6. Packing</span>
                        <p className="trades-dtls__contract-text">{trade.packaging}</p>
                        <AccessControl user={this.props.user} excludeCompanyTypes={[INSPECTION_COMPANY]}>
                            <span className="trades-dtls__contract-item">7. Price</span>
                            <p className="trades-dtls__contract-text">
                                US$ {trade.price}, - ({trade.price && converter.toWords(trade.price)} US Dollars) per
                                metric ton{` ${
                                trade.incoterm === 'CIF'
                                    ? `CIF free out, one safe berth, one safe port ${trade.destPort}, ${Countries[trade.destCountry]}.`
                                    : `FOB stowed, one safe berth, one safe port ${trade.loadPort}, ${Countries[trade.loadCountry]}.`
                                }`}
                                {` `}
                                Port and berth always accessible, vessel always afloat.
                            </p>
                        </AccessControl>
                        <span className="trades-dtls__contract-item">8. Origin</span>
                        <p className="trades-dtls__contract-text">{Countries[trade.origin]}</p>
                        <span className="trades-dtls__contract-item">
                            9. {trade.incoterm === 'CIF' ? 'Shipment' : 'Loading/delivery'}
                        </span>
                        <p className="trades-dtls__contract-text">
                            {`From the origin during ${moment(trade.deliveryStartDate).format(DATEFORMAT)} / ${moment(
                                trade.deliveryEndDate
                            ).format(DATEFORMAT)} agw/wp, in Buyer's option with 7 working days preadvise prior to loading.`}
                            <br/>
                            {trade.incoterm === 'CIF'
                                ? `From the origin during ${moment(trade.deliveryStartDate).format(DATEFORMAT)} / ${moment(
                                    trade.deliveryEndDate
                                ).format(DATEFORMAT)} agw/wp, in Seller's option.`
                                : 'Unconditional vessel substitutions to be allowed as long as within theoriginal declared laycan and min 7 working days preadvise is given to Seller.'}
                        </p>
                        <span className="trades-dtls__contract-item">10. Payment</span>
                        <div className="trades-dtls__contract-text">
                            {trade.payment} {trade.paymentPeriod}
                            <br/>
                            The original doc to consist of:<br/>
                            <ul className="trades-dtls__contract-list">
                                <li>
                                    Full set of 3/3 originals plus 3 (three) non-negotiable copies of 'clean on board'
                                    charter party bills
                                    of lading made out to order and blanked endorsed, marked 'freight prepaid' as per
                                    Charter Party
                                    {trade.incoterm === 'CIF' ? `, and showing ${Countries[trade.destCountry]}, ${trade.destPort}.` : '.'}
                                </li>
                                <li>
                                    Seller's original signed Invoice for the value of Product based on the Bill of
                                    Lading quantity payable
                                    3 business days after receipt.
                                </li>
                                <li>Certificate of origin issued by competent authority.</li>
                                <li>
                                    Certificate of quality issued by contractual appointed {trade.inspectionName} certifying
                                    that the goods
                                    loaded comply fully with the specifications set forth above under clause entitled
                                    "Quality".
                                </li>
                                <li>
                                    Certificate issued by contractual appointed {trade.inspectionName} certifying that the
                                    quality and
                                    appearance of rice delivered is equal to or better than the above
                                    mentioned {trade.inspectionName} sealed
                                    sample. (optional)
                                </li>
                                <li>Certificate of weight issued by contractual appointed {trade.inspectionName}.</li>
                                <li>Certificate of packing issued by contractual appointed {trade.inspectionName}. (optional)</li>
                                <li>
                                    Certificate of fumigation of goods effected at time of shipment of the goods from
                                    the origin issued by{` `}
                                    {trade.inspectionName}. Fumigation certificate with date after B/L date is acceptable.
                                </li>
                                <li>Phytosanitary certificate issued by competent authority</li>
                                <li>Non-GMO certificate issued by shippers. (optional)</li>
                                <li>Copy of export declaration. (optional)</li>
                                {trade.incoterm === 'CIF' && <li>Insurance Certificate. (optional)</li>}
                                {trade.specialRequest !== '' && <li>{trade.specialRequest}</li>}
                            </ul>
                            Except for the commercial invoice, third party doc are acceptable. Letters of indemnity for
                            missing doc
                            are not acceptable.
                        </div>
                        <span className="trades-dtls__contract-item">11. Insurance</span>
                        <p className="trades-dtls__contract-text">
                            All risk marine insurance 110% of the Contract value to be covered by{` `}
                            {trade.incoterm === 'CIF' ? trade.seller : trade.buyer}
                        </p>
                        <span className="trades-dtls__contract-item">12. Load terms</span>
                        <p className="trades-dtls__contract-text">{trade.discharge}</p>
                        <span className="trades-dtls__contract-item">13. Fumigation</span>
                        <p className="trades-dtls__contract-text">
                            To be effected after completion of loading at sellers costs and risk product to be used is
                            aluminum
                            phosphide or aluminum phosphide at 2 gram/m3 for 120 hours.
                        </p>
                        <span className="trades-dtls__contract-item">14. Governing Law and Arbitration</span>
                        <p className="trades-dtls__contract-text">
                            This contract shall be governed by and construed in accordance with English law. Any
                            disputes arising out
                            of or in connection the breach, termination or validity thereof shall be determined by
                            arbitration in
                            accordance with GAFTA Arbitration Rules No. 125.
                        </p>
                        <span className="trades-dtls__contract-item">15 Other terms</span>
                        <p className="trades-dtls__contract-text">
                            Except to the extent inconsistent herewith, all other terms and conditions shall be as per
                            GAFTA Contract
                            No. {trade.incoterm === 'CIF' ? GAFTA_CIF_CONTRACT_NO : GAFTA_FOB_CONTRACT_NO}
                            which are incorporated herein.
                        </p>
                        <span className="trades-dtls__contract-item">16. Miscellaneous</span>
                        <p className="trades-dtls__contract-text">
                            (a) Entire Agreement: This contract constitutes the entire agreement between the parties
                            relating to the
                            purchase of the product in the quantities and during the period specified herein. All prior
                            and
                            contemporaneous representations, understandings and agreements are superseded and merged
                            herein.
                            <br/> (b) Modifications: This contract cannot be modified except in a written form signed by
                            both parties
                            to this contract. No usage of trade or prior course of dealing or performance between the
                            parties shall be
                            deemed to modify the terms of this contract.
                            <br/>(c) Waiver: No delay or failure on Seller's or Buyer's part to force any right or claim
                            which either
                            of them may have hereunder shall constitute a waiver of such right or claim. Any waiver by
                            Seller or Buyer
                            of any term, provision or condition hereof or of any default hereunder in any one or more
                            instances shall
                            not be deemed to be a further or continuing waiver of such term, provision, or condition or
                            of any
                            subsequent default hereunder.
                        </p>
                        <span className="trades-dtls__contract-item">17. Acceptance</span>
                        <p className="trades-dtls__contract-text">
                            No term in the Buyers' purchase order, acknowledgement form or other document which
                            conflicts with the
                            terms hereof shall be binding on the Seller unless accepted in writing by the Seller.
                        </p>
                        <p className="trades-dtls__contract-text">
                            We are pleased to have concluded this transaction. Kindly sign and return acopy of this
                            contract for our
                            files.
                        </p>
                        <div className="row">
                            <div className="col-6 trades-dtls__contract-signatures">
                                <span>SELLER</span>
                                <br/>
                                Name: {trade.seller}
                                <br/>
                                Title: {info.sellerRole}
                            </div>
                            <div className="col-6 trades-dtls__contract-signatures">
                                <span>BUYER</span>
                                <br/>
                                Name: {trade.buyer}
                                <br/>
                                Title: {info.buyerRole}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    render() {
        return (
            <React.Fragment>
                {this.props.trade ? this.renderContract() : (
                    <div>Loading...</div>
                )}
            </React.Fragment>
        );
    }
}

export default SmartContract;
