import React from 'react';

const sections = [
    {
        title: 'Information We Collect',
        items: [
            'Account details such as your name, email address, phone number, password, and profile information.',
            'Booking details such as event tickets purchased, venues requested, dates, quantities, preferences, and order history.',
            'Vendor request information, including business details, event or venue information, listing content, and verification details.',
            'Payment-related information needed to process transactions. Full payment card details are handled by payment providers where applicable.',
            'Technical information such as device data, browser type, IP address, pages visited, and basic usage activity.',
        ],
    },
    {
        title: 'How We Use Your Information',
        items: [
            'To create and manage user accounts, ticket purchases, venue bookings, and vendor requests.',
            'To process payments, confirm bookings, send tickets, share updates, and provide customer support.',
            'To review vendor applications and help vendors manage event or venue listings.',
            'To improve platform performance, personalize the user experience, prevent fraud, and keep the platform secure.',
            'To send service messages, booking updates, important notices, and promotional communication where allowed.',
        ],
    },
    {
        title: 'Sharing of Information',
        items: [
            'We may share booking details with event organizers, venue owners, or approved vendors when needed to complete your ticket purchase or venue booking.',
            'We may share limited information with payment processors, hosting providers, analytics tools, and support services that help us operate the platform.',
            'We do not sell your personal information to third parties.',
            'We may disclose information if required by law, to protect our rights, or to prevent fraud, abuse, or security risks.',
        ],
    },
    {
        title: 'Cookies and Tracking',
        items: [
            'We may use cookies and similar technologies to keep you signed in, remember preferences, understand traffic, and improve the platform.',
            'You can control cookies through your browser settings, but some platform features may not work properly if cookies are disabled.',
        ],
    },
    {
        title: 'Data Security and Retention',
        items: [
            'We use reasonable technical and organizational measures to protect your personal information from unauthorized access, loss, misuse, or disclosure.',
            'We keep personal information only for as long as needed for platform operations, legal requirements, dispute resolution, fraud prevention, and record keeping.',
        ],
    },
    {
        title: 'Your Choices and Rights',
        items: [
            'You may update your account information from your profile or contact support if you need help.',
            'You may request access, correction, deletion, or restriction of your personal information where applicable law allows.',
            'You may unsubscribe from promotional messages, but we may still send important account, booking, or security notices.',
        ],
    },
];

const PrivacyPolicy = () => {
    return (
        <>
            <div className="header-space h-[75px] bg-transparent"></div>

            <section className="privacy-policy py-10 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="inner w-full max-w-6xl mx-auto">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-12">
                            Privacy Policy
                        </h1>

                        <p className="mb-6 sm:mb-10 text-base sm:text-lg leading-relaxed">
                            This Privacy Policy explains how MyVenueBooking collects, uses, stores, and shares
                            information when you use our venue and event platform. Our platform allows users to buy
                            tickets for events, book venues, and request vendor access to list their own events or
                            venues.
                        </p>

                        <ol className="list-decimal flex flex-col gap-6 sm:gap-10 my-6 sm:my-10 marker:text-lg pl-5 sm:pl-8">
                            {sections.map((section) => (
                                <li key={section.title}>
                                    <h5 className="text-lg sm:text-xl font-semibold mb-2">{section.title}</h5>
                                    <ul className="list-disc pl-5 sm:pl-8 space-y-2 text-base sm:text-lg leading-relaxed">
                                        {section.items.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ol>

                        <p className="mt-8 text-base sm:text-lg leading-relaxed text-muted-foreground">
                            We may update this Privacy Policy as our platform grows or legal requirements change.
                            Updated versions will be posted on this page.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
};

export default PrivacyPolicy;
