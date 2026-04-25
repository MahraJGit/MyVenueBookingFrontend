import { Button } from '@/components/ui/button';
import React from 'react';

const Terms = () => {
    return (
        <>
            <div className="header-space h-[75px] bg-transparent"></div>

            <section className="terms py-10 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="inner">
                        {/* Heading */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-12">
                            Terms & Privacy Policy
                        </h1>

                        {/* Intro paragraph */}
                        <p className="mb-6 sm:mb-10 text-base sm:text-lg leading-relaxed">
                            Welcome to Evenjo! We are committed to protecting your privacy and ensuring a safe and enjoyable experience for all our users. 
                            This page outlines our policies regarding the use of our website, ticket refunds, and the protection of your personal information. 
                            By using Evenjo, you agree to the terms outlined below.
                        </p>

                        {/* Terms List */}
                        <ol className="list-decimal flex flex-col gap-6 sm:gap-10 my-6 sm:my-10 marker:text-lg mx-4">
                            {/* Terms of Use */}
                            <li>
                                <h5 className="text-lg sm:text-xl font-semibold mb-2">Terms of Use</h5>
                                <p className="mb-2 text-base sm:text-lg leading-relaxed">
                                    By accessing and using Evenjo, you agree to comply with the following terms and conditions:
                                </p>
                                <ul className="list-disc pl-5 sm:pl-8 space-y-2">
                                    <li>Eligibility: You must be at least 18 years old or have the consent of a legal guardian to use our services.</li>
                                    <li>Account Responsibility: You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</li>
                                    <li>Prohibited Activities: You may not use our site for any illegal or unauthorized purpose, including but not limited to fraud, reselling tickets without authorization, or violating intellectual property rights.</li>
                                    <li>Event Changes: Evenjo is not responsible for changes or cancellations made by event organizers. We will, however, notify you of any significant changes to your booked events.</li>
                                </ul>
                            </li>

                            {/* Ticket Refund Policy */}
                            <li>
                                <h5 className="text-lg sm:text-xl font-semibold mb-2">Ticket Refund Policy</h5>
                                <p className="mb-2 text-base sm:text-lg leading-relaxed">
                                    At Evenjo, we strive to make your ticket-buying experience as seamless as possible. Please review our refund policy below:
                                </p>
                                <ul className="list-disc pl-5 sm:pl-8 space-y-2">
                                    <li>Refund Eligibility: Refunds are available only if an event is canceled or postponed. In such cases, we will notify you and provide instructions on how to request a refund.</li>
                                    <li>No Refunds for Personal Reasons: Unfortunately, we cannot offer refunds for changes in personal plans, missed events, or incorrect ticket purchases.</li>
                                    <li>Processing Time: Refunds may take up to 10 business days to process, depending on your payment method.</li>
                                    <li>Contact Us: For refund inquiries, please contact our customer support team at [support@evenjo.com].</li>
                                </ul>
                            </li>

                            {/* Privacy Policy */}
                            <li>
                                <h5 className="text-lg sm:text-xl font-semibold mb-2">Privacy Policy</h5>
                                <p className="mb-2 text-base sm:text-lg leading-relaxed">
                                    Your privacy is important to us. This section explains how we collect, use, and protect your personal information:
                                </p>
                                <ul className="list-disc pl-5 sm:pl-8 space-y-2">
                                    <li>Information We Collect: We collect information such as your name, email address, payment details, and event preferences when you create an account or purchase tickets.</li>
                                    <li>How We Use Your Information: Your information is used to process transactions, send event updates, and improve our services. We do not sell or share your data with third parties for marketing purposes.</li>
                                    <li>Data Security: We use industry-standard encryption and security measures to protect your data from unauthorized access or breaches.</li>
                                    <li>Cookies: Our website uses cookies to enhance your browsing experience. You can disable cookies in your browser settings, but this may affect site functionality.</li>
                                    <li>Third-Party Links: Our site may contain links to third-party websites. We are not responsible for the privacy practices or content of these sites.</li>
                                </ul>
                            </li>
                        </ol>

                        {/* Buttons */}
                        <div className="authorization-cta flex flex-col sm:flex-row items-stretch sm:items-end justify-end gap-4 mt-6">
                            <Button variant="default" size="lg" className="cursor-pointer w-full sm:w-auto">Accept</Button>
                            <Button variant="secondary" size="lg" className="cursor-pointer w-full sm:w-auto">Decline</Button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Terms;
