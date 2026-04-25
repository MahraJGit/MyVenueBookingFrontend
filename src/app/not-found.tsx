import React from "react";
import "@/styles/notFound.css";
import { Button } from "@/components/ui/button";
import Header from "@/components/common/Header";
import Link from "next/link";

const NotFound = () => {
    return (
        <>
            <Header />
            <div className="notFound-hero">
                <div className="container mx-auto px-4">
                    <div className="inner h-screen flex items-center justify-center flex-col gap-32">
                        <div className="notFound-top flex flex-col items-center">
                            <p className="text-base sm:text-lg md:text-xl mb-6  text-center">
                                Oops! The page you're looking for doesn't exist or may have been moved.
                            </p>
                            <Button asChild variant="default" size="lg">
                                <Link href="/">Back to Homepage</Link>
                            </Button>
                        </div>
                        <div className="notFound-bottom">
                            <h1 className="font-bold tracking-tight text-[100px] sm:text-[150px] md:text-[200px] lg:text-[220px]">404</h1>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotFound;
