"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import IMask from "imask";
import { images } from "../const/images";

const dummyHistory = [
    { month: "January", year: 2024, price: 1200, status: "Paid" },
    { month: "February", year: 2024, price: 1200, status: "Paid" },
    { month: "March", year: 2024, price: 1200, status: "Paid" },
    { month: "April", year: 2024, price: 1200, status: "Paid" },
    { month: "May", year: 2024, price: 1200, status: "Pending" },
];

export default function Subscription() {
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [flipped, setFlipped] = useState(false);

    const numberRef = useRef(null);
    const expiryRef = useRef(null);
    const cvcRef = useRef(null);

    // Input masks
    useEffect(() => {
        if (!numberRef.current) return;
        const mask = IMask(numberRef.current, {
            mask: [
                { mask: "0000 000000 00000", regex: "^3[47]\\d{0,13}", cardtype: "amex" },
                { mask: "0000 0000 0000 0000", regex: "^(?:6011|65\\d{0,2}|64[4-9]\\d?)\\d{0,12}", cardtype: "discover" },
                { mask: "0000 000000 0000", regex: "^3(?:0([0-5]|9)|[689]\\d?)\\d{0,11}", cardtype: "diners" },
                { mask: "0000 0000 0000 0000", regex: "^(5[1-5]\\d{0,2}|22[2-9]\\d{0,1}|2[3-7]\\d{0,2})\\d{0,12}", cardtype: "mastercard" },
                { mask: "0000 000000 00000", regex: "^(?:2131|1800)\\d{0,11}", cardtype: "jcb15" },
                { mask: "0000 0000 0000 0000", regex: "^(?:35\\d{0,2})\\d{0,12}", cardtype: "jcb" },
                { mask: "0000 0000 0000 0000", regex: "^(?:5[0678]\\d{0,2}|6304|67\\d{0,2})\\d{0,12}", cardtype: "maestro" },
                { mask: "0000 0000 0000 0000", regex: "^4\\d{0,15}", cardtype: "visa" },
                { mask: "0000 0000 0000 0000", regex: "^62\\d{0,14}", cardtype: "unionpay" },
                { mask: "0000 0000 0000 0000", cardtype: "unknown" },
            ],
            dispatch: (appended, dynamicMasked) => {
                const nmbr = (dynamicMasked.value + appended).replace(/\D/g, "");
                for (let i = 0; i < dynamicMasked.compiledMasks.length; i++) {
                    const re = new RegExp(dynamicMasked.compiledMasks[i].regex);
                    if (re.test(nmbr)) return dynamicMasked.compiledMasks[i];
                }
                return dynamicMasked.compiledMasks[dynamicMasked.compiledMasks.length - 1];
            },
        });
        mask.on("accept", () => setNumber(mask.value));
        return () => mask.destroy();
    }, []);

    useEffect(() => {
        if (!expiryRef.current) return;
        const mask = IMask(expiryRef.current, {
            mask: "MM{/}YY",
            blocks: {
                YY: { mask: IMask.MaskedRange, from: 0, to: 99 },
                MM: { mask: IMask.MaskedRange, from: 1, to: 12 },
            },
        });
        mask.on("accept", () => setExpiry(mask.value));
        return () => mask.destroy();
    }, []);

    useEffect(() => {
        if (!cvcRef.current) return;
        const mask = IMask(cvcRef.current, { mask: "0000" });
        mask.on("accept", () => setCvc(mask.value));
        return () => mask.destroy();
    }, []);

    const formattedName = useMemo(() => (name.trim() ? name : "MATTHEW EHORN"), [name]);
    const formattedNumber = useMemo(() => (number || "0123 4567 8910 1112"), [number]);
    const formattedExpiry = useMemo(() => (expiry || "01/23"), [expiry]);
    const formattedCvc = useMemo(() => (cvc || "985"), [cvc]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-brand">Subscription</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Card Preview */}
                <div className="relative h-56 w-[360px] sm:w-[400px] mx-auto [perspective:1000px]">
                    <div
                        className={`creditcard relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""
                            }`}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 rounded-2xl shadow-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 [backface-visibility:hidden]">
                            <div className="flex items-center justify-between">
                                <img
                                    src={images.chip}
                                    alt="chip"
                                    className="h-6 w-8 object-contain"
                                />
                                <span className="text-2xl font-bold">VISA</span>
                            </div>
                            <div className="mt-6 text-sm opacity-80">card number</div>
                            <div id="svgnumber" className="text-2xl tracking-[0.2em] font-semibold mt-1">
                                {formattedNumber}
                            </div>
                            <div className="flex items-end justify-between mt-6">
                                <div>
                                    <div className="text-xs opacity-80">cardholder name</div>
                                    <div id="svgname" className="font-semibold">
                                        {formattedName}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs opacity-80">expiration</div>
                                    <div id="svgexpire" className="font-semibold">
                                        {formattedExpiry}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 rounded-2xl shadow-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                            <div className="h-10 -mx-6 bg-black/70" />
                            <div className="mt-6">
                                <div className="text-xs opacity-80">Security Code</div>
                                <div className="bg-white text-black rounded px-3 py-2 w-28 mt-1 text-right">
                                    <span id="svgsecurity">{formattedCvc}</span>
                                </div>
                            </div>
                            <div className="absolute bottom-4 right-6 text-2xl font-bold">VISA</div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                    }}
                >
                    <div>
                        <label className="block text-sm font-medium text-brand mb-1">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.toUpperCase())}
                            onFocus={() => setFlipped(false)}
                            className="w-full border border-[color:var(--primary)] rounded px-3 py-2 text-sm focus:outline-none "
                            placeholder="JOHN DOE"
                            autoComplete="cc-name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand mb-1">Card Number</label>
                        <input
                            id="cardnumber"
                            ref={numberRef}
                            inputMode="numeric"
                            onFocus={() => setFlipped(false)}
                            className="w-full border border-[color:var(--primary)] rounded px-3 py-2 text-sm focus:outline-none "
                            placeholder="0123 4567 8910 1112"
                            autoComplete="cc-number"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-brand mb-1">Expiration (mm/yy)</label>
                            <input
                                id="expirationdate"
                                ref={expiryRef}
                                inputMode="numeric"
                                onFocus={() => setFlipped(false)}
                                className="w-full border border-[color:var(--primary)] rounded px-3 py-2 text-sm focus:outline-none "
                                placeholder="01/23"
                                autoComplete="cc-exp"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand mb-1">Security Code</label>
                            <input
                                id="securitycode"
                                ref={cvcRef}
                                inputMode="numeric"
                                onFocus={() => setFlipped(true)}
                                onBlur={() => setFlipped(false)}
                                className="w-full border border-[color:var(--primary)] rounded px-3 py-2 text-sm focus:outline-none "
                                placeholder="985"
                                autoComplete="cc-csc"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded bg-[color:var(--primary)] !text-white font-medium "
                    >
                        Pay Now
                    </button>
                </form>
            </div>

            {/* Payment History Table */}
            <div className="mt-10">
                <h3 className="text-xl font-semibold text-brand mb-4">Payment History</h3>
                <div className="rounded border border-[color:var(--primary)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-[color:var(--primary)]/10 text-brand">
                                <tr>
                                    <th className="px-4 py-2 border-b text-left text-brand/80 font-medium">Month</th>
                                    <th className="px-4 py-2 border-b text-left text-brand/80 font-medium">Year</th>
                                    <th className="px-4 py-2 border-b text-left text-brand/80 font-medium">Price</th>
                                    <th className="px-4 py-2 border-b text-left text-brand/80 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dummyHistory.map((c, idx) => (
                                    <tr key={c.month + c.year} className="border-t border-[color:var(--primary)]/20">
                                        <td className="px-4 py-3 whitespace-nowrap">{c.month}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{c.year}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {"$" + c.price.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                c.status === "Paid"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
