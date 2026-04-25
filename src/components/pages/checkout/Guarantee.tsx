import { CircleDollarSign, ShieldCheck } from 'lucide-react'
import React from 'react'

const Guarantee = () => {
    return (
        <>
            <div className="Guarantee space-y-3 bg-[#1B1B1B59] p-6 rounded-lg border border-[#99999933]">
                <p className="flex items-center gap-2">
                    <ShieldCheck size={24} className="text-primary shrink-0" />
                    FanProtect : every order is 100% guaranteed
                </p>

                <p className="flex items-center gap-2">
                    <CircleDollarSign size={24} className="text-primary shrink-0" />
                    Easy Refund
                </p>

                <p className="ml-8 text-[#999999]">Change of plans? Get your money back up to 24 hours before the event.</p>
            </div>
        </>
    )
}

export default Guarantee