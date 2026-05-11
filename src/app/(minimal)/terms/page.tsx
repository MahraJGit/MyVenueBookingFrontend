import React from 'react';

const sections = [
    {
        title: 'Use of the Platform',
        items: [
            'You may use MyVenueBooking to browse events, buy tickets, book venues, and request access to become a vendor.',
            'You agree to provide accurate information when creating an account, purchasing tickets, booking venues, or submitting a vendor request.',
            'You are responsible for keeping your login details secure and for all activity that happens through your account.',
        ],
    },
    {
        title: 'Tickets and Event Bookings',
        items: [
            'Ticket availability, pricing, event schedules, venue rules, and seat details may be set by the event organizer or vendor.',
            'After a ticket purchase is completed, you must review your order details carefully because incorrect purchases may not be refundable.',
            'If an event is cancelled, postponed, or changed, we may notify affected users and share the available options provided by the organizer.',
        ],
    },
    {
        title: 'Venue Bookings',
        items: [
            'Venue booking requests are subject to availability, approval, pricing, and any rules shared by the venue owner or vendor.',
            'You agree to use booked venues responsibly and follow all venue policies, safety rules, timing restrictions, and payment requirements.',
            'Any damage, misuse, or violation of venue rules may result in cancellation, additional charges, or account restrictions.',
        ],
    },
    {
        title: 'Vendor Accounts and Listings',
        items: [
            'Users may request to become vendors so they can list events or venues on the platform.',
            'Vendor approval is not guaranteed, and we may review, approve, reject, suspend, or remove vendor access when needed.',
            'Vendors are responsible for keeping event and venue information accurate, including prices, dates, availability, descriptions, images, and policies.',
        ],
    },
    {
        title: 'Payments, Fees, and Refunds',
        items: [
            'Payments must be completed through the payment methods supported by the platform.',
            'Service fees, booking fees, taxes, or vendor charges may apply and will be shown where relevant during checkout.',
            'Refunds may depend on the event organizer, venue owner, vendor policy, payment provider rules, or applicable law.',
        ],
    },
    {
        title: 'Prohibited Activities',
        items: [
            'You may not use the platform for fraud, fake bookings, unauthorized ticket resale, abusive behavior, illegal activity, or misleading listings.',
            'You may not copy, misuse, interfere with, or attempt to access parts of the platform that are not meant for you.',
            'We may suspend or terminate accounts that violate these terms or create risk for users, vendors, or the platform.',
        ],
    },
];

const Terms = () => {
    return (
        <>
            <div className="header-space h-[75px] bg-transparent"></div>

            <section className="terms py-10 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="inner w-full max-w-6xl mx-auto">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-12">
                            Terms and Conditions
                        </h1>

                        <p className="mb-6 sm:mb-10 text-base sm:text-lg leading-relaxed">
                            Welcome to MyVenueBooking. These Terms and Conditions explain the rules for using our
                            venue and event platform, including buying event tickets, booking venues, and applying
                            to become a vendor. By accessing or using the platform, you agree to follow these terms.
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
                            We may update these terms from time to time. Continued use of MyVenueBooking after
                            changes are posted means you accept the updated terms.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Terms;
