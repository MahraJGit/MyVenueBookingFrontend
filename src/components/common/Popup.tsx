'use client';

import Image from 'next/image';
import { Button } from "@/components/ui/button";

interface PopupProps {
    isVisible: boolean;
    title: string;
    message: string;
    imageSrc: string;
    buttonText: string;
    onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ isVisible, title, message, imageSrc, buttonText, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1F1F1F] w-full max-w-md p-[36px_24px] rounded-3xl shadow-lg flex flex-col items-center">
                <div className="flex flex-col gap-10 items-center justify-center mb-4 text-center">
                    <Image src={imageSrc} alt="Popup Icon" width={64} height={64} />
                    <h3 className="text-[#FFFFFF] text-xl font-semibold">{title}</h3>
                </div>

                <p className="text-[#999999] text-center">{message}</p>

                <Button onClick={onClose} className="w-full bg-primary text-white mt-10">
                    {buttonText}
                </Button>
            </div>
        </div>
    );
};

export default Popup;