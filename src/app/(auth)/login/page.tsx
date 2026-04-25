"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Apple, Chrome, Facebook } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import "@/styles/auth.css";

const login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <section className="login">
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
          <p className="text-gray-400 mt-3 text-center text-sm">
            Please enter your phone number to login
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="email" className="w-full max-w-sm">
          <TabsList className="grid grid-cols-2 bg-[#242424] border border-[#242424] rounded-lg mb-6 w-full">
            <TabsTrigger
              value="email"
              className="data-[state=active]:bg-pink-600 data-[state=active]:text-white bg-[#242424] text-gray-300"
            >
              Email
            </TabsTrigger>
            <TabsTrigger
              value="phone"
              className="data-[state=active]:bg-pink-600 data-[state=active]:text-white bg-[#242424] text-gray-300"
            >
              Phone number
            </TabsTrigger>
          </TabsList>

          {/* Email Login */}
          <TabsContent value="email">
            <form className="flex flex-col space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300 text-xs">
                  Email
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-300 text-xs">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="border-gray-500" />
                  <Label
                    htmlFor="remember"
                    className="text-gray-400 text-xs cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
                <a
                  href="#"
                  className="text-xs text-gray-400 hover:text-pink-500 transition"
                >
                  Forgot Password?
                </a>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="mt-6 cursor-pointer"
              >
                Log in
              </Button>

              <div className="text-center mt-4 social-login-divider">
                <span className="text-xs text-gray-500">Or continue with</span>
              </div>

              <div className="flex justify-center gap-3 mt-2">
                <Button
                  variant="outline"
                  className="bg-[#1F1F1F] border-[#303030] hover:bg-[#333] px-10 h-14"
                >
                  <Image
                    src="/images/apple.png"
                    alt="Apple"
                    width={20}
                    height={20}
                    className="h-6"
                  />
                </Button>
                <Button
                  variant="outline"
                  className="bg-[#1F1F1F] border-[#303030] hover:bg-[#333] px-10 h-14"
                >
                  <Image
                    src="/images/google.png"
                    alt="Google"
                    width={20}
                    height={20}
                    className="h-6"
                  />
                </Button>
                <Button
                  variant="outline"
                  className="bg-[#1F1F1F] border-[#303030] hover:bg-[#333] px-10 h-14"
                >
                  <Image
                    src="/images/facebook.png"
                    alt="Facebook"
                    width={20}
                    height={20}
                    className="h-6"
                  />
                </Button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">
                New to account?{" "}
                <a href="/signup" className="text-pink-500 hover:underline block">
                  Create account
                </a>
              </p>
            </form>
          </TabsContent>

          {/* Phone login */}
          <TabsContent value="phone">
            <form className="flex flex-col space-y-4 max-w-sm mx-auto text-gray-400">
              <div className="flex gap-2">
                <Select defaultValue="+1">
                  <SelectTrigger className="bg-[#242424] border border-[#242424] text-white rounded-md mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242424] text-white">
                    <SelectItem value="+1">
                      <div className="flex items-center gap-2 w-[50px]">
                        <Image
                          src="/svg/usa.svg"
                          alt="USA Flag"
                          width={24}
                          height={16}
                        />
                        <span>+1</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+44">🇬🇧 +44</SelectItem>
                    <SelectItem value="+91">🇮🇳 +91</SelectItem>
                    <SelectItem value="+61">🇦🇺 +61</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="tel"
                  placeholder="23445678"
                  className="bg-[#242424] border border-[#242424] text-white placeholder:text-gray-500 flex-grow mt-1"
                />
              </div>

              <div className="relative">
                <Input
                  type="password"
                  placeholder="818367"
                  className="bg-[#242424] border border-[#242424] text-white placeholder:text-gray-500 pl-3 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500"
                  aria-label="Toggle password visibility"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-pink-600 bg-[#242424] border-gray-600 rounded"
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#"
                  className="text-gray-400 hover:text-pink-500 transition"
                >
                  Forgot Password?
                </a>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="mt-6 cursor-pointer w-full bg-pink-600 hover:bg-pink-700"
              >
                Log in
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4">
                New to account?{" "}
                <a href="#" className="text-pink-500 hover:underline">
                  Create account
                </a>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default login;
