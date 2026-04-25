"use client"

import { Check, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const payment = () => {
  return (
    <div className="rounded-2xl bg-[#121212] p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* LEFT SIDE */}
        <div className="space-y-6">
          {/* Payment Methods */}
         <div className="flex gap-4">
            <div className="flex h-12 w-20 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-sm">
              <Image src="/images/gpay.png" alt="VISA" width={40} height={25} />
            </div>
            <div className="flex h-12 w-20 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-sm">
              <Image src="/images/vpay.png" alt="VISA" width={40} height={25} />
            </div>
            <div className="flex h-12 w-20 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-sm">
              <Image src="/images/apay.png" alt="VISA" width={40} height={25} />
            </div>
            <div className="flex h-12 w-20 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-sm">
              <Image src="/images/bpay.png" alt="VISA" width={40} height={25} />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            This credit card will be used by default for billing.
          </p>

          {/* Form */}
          <div className="space-y-4">
            <Input defaultValue="Negar Khosravi" placeholder="Name on card" />

            <div className="relative">
              <Input defaultValue="9870 8890 8890 8890" placeholder="Card number" />
              <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input defaultValue="16 / 26" placeholder="Expiry" />
              <Input defaultValue="123" placeholder="CVC/CVV" />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* Credit Card Preview */}
          <div className="relative w-full rounded-2xl bg-linear-to-br from-pink-500 via-purple-600 to-zinc-900 p-6 text-white shadow-lg">
            <div className="flex justify-between mb-5">
              <span className="text-sm opacity-80">Credit Card</span>
              <span className="text-sm">VISA</span>
            </div>
            <div className="flex items-center gap-4">
              <Image src="/svg/cardsim.svg" alt="Chip" width={40} height={30} />
              <h4>VISA</h4>
            </div>
            <div className="mt-5 text-lg tracking-widest">
              •••• •••• •••• 8557
            </div>

            <div className="mt-6 flex justify-between text-sm">
              <div>
                <p className="opacity-70">Cardholder Name</p>
                <p>Negar Khosravi</p>
              </div>
              <div>
                <p className="opacity-70">Expiry date</p>
                <p>08 / 25</p>
              </div>
            </div>
          </div>

          {/* Add Payment Method */}
          <Dialog>
            {/* CLICKABLE CARD */}
            <DialogTrigger asChild>
              <Card
                role="button"
                className="flex h-40 cursor-pointer items-center justify-center border-dashed border-zinc-700 bg-zinc-800 transition hover:border-pink-500"
              >
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span>Add payment method</span>
                </div>
              </Card>
            </DialogTrigger>

            {/* MODAL */}
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle>Add new card</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Input placeholder="Name on card" />
                <Input placeholder="Card number" />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="MM / YY" />
                  <Input placeholder="CVC" />
                </div>

                <Button className="w-full bg-pink-500 hover:bg-pink-600">
                  Add card
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  )
}

export default payment