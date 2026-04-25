import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Calendar,
    MapPin,
    Ticket,
    Download,
    RotateCcw,
} from "lucide-react"

const ViewTicket = () => {
    return (
        <Card className="bg-[#121212] p-8 text-white">
            {/* HEADER */}
            <div className="flex items-start justify-between">
                <div className="flex gap-6">
                    <Image
                        src="/images/card-img.png"
                        alt="Event"
                        width={120}
                        height={120}
                        className="rounded-xl object-cover"
                    />

                    <div>
                        <h3 className="text-pink-500 font-semibold">Order Details</h3>
                        <h2 className="mt-2 text-xl font-bold">Adele Concert</h2>

                        <div className="mt-4 text-sm text-muted-foreground">
                            <p>Order Tracking Code</p>
                            <p className="text-white"># R123</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Refund ticket
                    </Button>
                    <Button size="sm" className="bg-pink-500 hover:bg-pink-600">
                        <Download className="mr-2 h-4 w-4" />
                        Download ticket
                    </Button>
                </div>
            </div>

            {/* EVENT DETAILS */}
            <div className="mt-8">
                <div className="flex items-center gap-1 mb-4">
                    <h4 className="text-pink-500 font-semibold">Event Details</h4>
                    <Separator className="bg-zinc-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div className="flex gap-3">
                        <MapPin className="text-pink-500" />
                        <div>
                            <p className="font-medium">Location</p>
                            <p className="text-muted-foreground">
                                American Airlines Center<br />
                                Dallas, Texas, USA
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Calendar className="text-pink-500" />
                        <div>
                            <p className="font-medium">Event Date</p>
                            <p className="text-muted-foreground">
                                Tue 30 Sep • 7:30 PM
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Ticket className="text-pink-500" />
                        <div>
                            <p className="font-medium">Selected Seat</p>
                            <p className="text-muted-foreground">
                                Section 324 • Row T • Seats 29–30
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAYMENT */}
            <div className="mt-10">
                <div className="flex items-center gap-1 mb-4">
                    <h4 className="text-pink-500 font-semibold">Payment</h4>
                    <Separator className="bg-zinc-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                    <div>
                        <p className="text-muted-foreground">Ticket count</p>
                        <p className="font-medium">2 tickets</p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Transaction costs</p>
                        <p className="font-medium">$20</p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Total paid</p>
                        <p className="font-medium">$260</p>
                    </div>

                    <div className="row-span-2 flex justify-end">
                        <div className="h-32 w-32 rounded-lg bg-pink-500 p-2">
                            {/* Placeholder QR */}
                            <div className="h-full w-full bg-black opacity-30 rounded-md" />
                        </div>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Paid by</p>
                        <p className="font-medium">Negar Khosravi</p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Payment method</p>
                        <p className="font-medium">Stripe</p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Transaction ID</p>
                        <p className="font-medium">7984-KJD8-3827</p>
                    </div>
                </div>
            </div>
        </Card>
    )
}
export default ViewTicket