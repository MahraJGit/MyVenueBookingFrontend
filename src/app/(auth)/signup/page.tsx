"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Lock, Mail } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import "@/styles/auth.css";

const signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  return (
    <section className="signup">
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
            Create your account
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

          {/* Email Signup */}
          <TabsContent value="email">
            <form className="flex flex-col space-y-4">
              {/* First & Last Name */}
              <div className="flex gap-2">
                <div className="w-1/2">
                  <Label htmlFor="firstName" className="text-gray-300 text-xs">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500 mt-1"
                  />
                </div>
                <div className="w-1/2">
                  <Label htmlFor="lastName" className="text-gray-300 text-xs">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500 mt-1"
                  />
                </div>
              </div>

              {/* Email */}
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
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Password */}
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
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Signup Button */}
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="mt-6 cursor-pointer w-full bg-pink-600 hover:bg-pink-700"
              >
                Sign up
              </Button>

              {/* Social Login Section */}
              <div className="text-center mt-4 social-login-divider">
               <span className="text-sm text-gray-500">Or continue with</span>
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

              {/* Footer Link */}
              <p className="text-center text-xs text-gray-400 mt-4">
                Have an account?{" "}
                <a href="#" className="text-pink-500 hover:underline">
                   Sign in
                </a>
              </p>
            </form>
          </TabsContent>

          {/* Phone Signup */}
          <TabsContent value="phone">
            <form className="flex flex-col space-y-4 max-w-sm mx-auto text-gray-400">
              {/* First & Last Name */}
              <div className="flex gap-2">
                <div className="w-1/2">
                  <Label htmlFor="firstName" className="text-gray-300 text-xs">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500 mt-1"
                  />
                </div>
                <div className="w-1/2">
                  <Label htmlFor="lastName" className="text-gray-300 text-xs">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500 mt-1"
                  />
                </div>
              </div>

              {/* Phone with Country Code */}
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
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-[#242424] border border-[#242424] text-white placeholder:text-gray-500 flex-grow"
                  />
                </div>
              </div>

              {/* Password */}
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
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Signup Button */}
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="mt-6 cursor-pointer w-full bg-pink-600 hover:bg-pink-700"
              >
                Sign up
              </Button>

              {/* Footer Link */}
              <p className="text-center text-xs text-gray-400 mt-4">
                Already have an account?{" "}
                <a href="#" className="text-pink-500 hover:underline">
                  Log in
                </a>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default signup;
