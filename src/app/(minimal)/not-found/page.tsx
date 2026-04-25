import React from 'react'
import "@/styles/notFound.css"
import { Button } from '@/components/ui/button'
const notFound = () => {
    return (
        <>
            <div className="notFound-hero">
                <div className="container mx-auto px-4">
                    <div className="inner h-screen flex items-center justify-center flex-col gap-32">
                        <div className="notFound-top flex flex-col items-center">
                            <p className='text-xl! mb-6 text-center'>Oops! The page you're looking for doesn't exist or may have been moved.</p>
                            <Button variant="default" size="lg">Back to Homepage</Button>
                        </div>
                        <div className="notFound-bottom">
                            <h1 className='text-[220px]!'>404</h1>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default notFound