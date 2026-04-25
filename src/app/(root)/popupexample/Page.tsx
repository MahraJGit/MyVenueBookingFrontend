'use client';

import { useState } from 'react';
import Popup from '@/components/common/Popup';
import { Button } from '@/components/ui/button';

const SomeComponent = () => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'error' | 'success'>('error');

  const openErrorPopup = () => {
    setPopupType('error');
    setIsPopupVisible(true);
  };

  const openSuccessPopup = () => {
    setPopupType('success');
    setIsPopupVisible(true);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
  };

  // Error Popup Content
  const errorContent = {
    title: "Password Change Failed",
    message: "There was a problem changing your password.",
    imageSrc: "/svg/error-icon.svg",
    buttonText: "Try Again"
  };

  // Success Popup Content
  const successContent = {
    title: "Success!",
    message: "Your password was changed successfully.",
    imageSrc: "/svg/success-icon.svg",
    buttonText: "Great!"
  };

  return (
    <div className="pt-26">
      <Button onClick={openErrorPopup}>Show Error Popup</Button>
      <Button onClick={openSuccessPopup} className="ml-4">Show Success Popup</Button>

      <Popup
        isVisible={isPopupVisible}
        title={popupType === 'error' ? errorContent.title : successContent.title}
        message={popupType === 'error' ? errorContent.message : successContent.message}
        imageSrc={popupType === 'error' ? errorContent.imageSrc : successContent.imageSrc}
        buttonText={popupType === 'error' ? errorContent.buttonText : successContent.buttonText}
        onClose={closePopup}
      />
    </div>
  );
};

export default SomeComponent;