"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import "@/styles/auth.css";

const verifyOtp = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;
        const otpCopy = [...otp];
        otpCopy[index] = value;
        setOtp(otpCopy);

        // Move to the next input field automatically when a digit is entered
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) {
                nextInput.focus();
            }
        }
    };

    return (
        <section className="verify-otp">
            <div className="flex flex-col items-center justify-center text-white px-4">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <Image
                        src="/images/logo2.png"
                        alt="Logo"
                        width={48}
                        height={48}
                        priority
                    />
                    <h2 className="text-xl font-semibold text-white mt-6">
                        Verify your account
                    </h2>
                    <p className="text-gray-400 mt-3 text-center text-sm max-w-xs leading-relaxed">
                        Enter the 6-digit code we sent to your phone/email.
                    </p>
                </div>

                {/* OTP Input */}
                <div className="flex gap-2 mt-6 justify-center">
                    {otp.map((digit, index) => (
                        <Input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            value={digit}
                            onChange={(e) => handleChange(e, index)}
                            maxLength={1}
                            className="bg-[#242424] border border-[#242424] text-white text-center placeholder:text-gray-500 w-12 h-12"
                        />
                    ))}
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="mt-6 cursor-pointer w-full bg-pink-600 hover:bg-pink-700 max-w-xs"
                >
                    Verify code
                </Button>

                {/* Resend OTP */}
                <p className="text-center text-xs text-gray-400 mt-4">
                    Didn’t receive the code?{" "}
                    <a href="#" className="text-pink-500 hover:underline">
                        Resend code
                    </a>
                </p>
            </div>
        </section>
    );
};

export default verifyOtp;
