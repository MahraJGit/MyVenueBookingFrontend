import React from 'react'

const TimeLeft = () => {
    return (
        <>
            <section className="timeLeft mb-6">
                <div className="flex items-center gap-4">
                    <div className="time flex items-center gap-2">
                        <div className="flex items-center gap-2 ">
                            <span className="bg-[linear-gradient(360deg,rgba(26,26,26,0.5)_41.28%,#262626_52.11%)] px-4 py-1.5 border-#1F1F1F border rounded">0</span>
                            <span className="bg-[linear-gradient(360deg,rgba(26,26,26,0.5)_41.28%,#262626_52.11%)] px-4 py-1.5 border-#1F1F1F border rounded">9</span>
                        </div>
                        <span className="">:</span>
                        <div className="flex items-center gap-2 ">
                            <span className="bg-[linear-gradient(360deg,rgba(26,26,26,0.5)_41.28%,#262626_52.11%)] px-4 py-1.5 border-#1F1F1F border rounded">4</span>
                            <span className="bg-[linear-gradient(360deg,rgba(26,26,26,0.5)_41.28%,#262626_52.11%)] px-4 py-1.5 border-#1F1F1F border rounded">3</span>
                        </div>
                    </div>
                    <div className="timeLeft-text">
                        <p className="text-[#B3B3B3]">left to complete recive ticket</p>
                        <span className="text-xs text-[#999999]">Your price is only guaranteed for this time!</span>
                    </div>
                </div>
            </section>
        </>
    )
}

export default TimeLeft