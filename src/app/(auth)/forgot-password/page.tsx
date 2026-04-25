"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import "@/styles/auth.css";

const forgetPassword = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <section className="forgot-password">
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

          {/* Heading */}
          <h2 className="text-xl font-semibold text-white mt-6">
            Forgot your password?
          </h2>

          {/* Subtext */}
          <p className="text-gray-400 mt-3 text-center text-sm max-w-sm leading-relaxed">
            Please enter the phone number associated with your account and we'll
            send you a verification code.
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

          {/* Email Tab */}
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

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="mt-6 cursor-pointer w-full bg-pink-600 hover:bg-pink-700"
              >
                Send reset link
              </Button>
            </form>
          </TabsContent>

          {/* Phone Tab */}
          <TabsContent value="phone">
            <form className="flex flex-col space-y-4 max-w-sm mx-auto text-gray-400">
              <div>
                <Label htmlFor="phone" className="text-gray-300 text-xs">
                  Phone number
                </Label>
                <div className="flex gap-2 mt-1">
                  <Select defaultValue="+1">
                    <SelectTrigger className="bg-[#242424] border border-[#242424] text-white rounded-md">
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
                    id="phone"
                    type="tel"
                    placeholder="23445678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-[#242424] border border-[#242424] text-white placeholder:text-gray-500 flex-grow"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="mt-6 cursor-pointer w-full bg-pink-600 hover:bg-pink-700"
              >
                Send code
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default forgetPassword;
