"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import Image from "next/image";

import "@/styles/auth.css";

const resetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <section className="set-password">
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
            Reset Password
          </h2>
          <p className="text-gray-400 mt-3 text-center text-sm max-w-xs leading-relaxed">
            Enter a new password below to change your password.
          </p>
        </div>

        {/* Reset Password Form */}
        <form className="flex flex-col space-y-4 max-w-sm mx-auto text-gray-400">
          {/* New Password */}
          <div>
            <Label htmlFor="newPassword" className="text-gray-300 text-xs">
              New Password
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="text-gray-300 text-xs">
              Re-enter New Password
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="mt-6 cursor-pointer w-auto bg-pink-600 hover:bg-pink-700"
          >
            Reset Password
          </Button>

          {/* Back to Login Link */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Remember your password?{" "}
            <a href="#" className="text-pink-500 hover:underline">
              Back to Login
            </a>
          </p>
        </form>
      </div>
    </section>
  );
};

export default resetPassword;