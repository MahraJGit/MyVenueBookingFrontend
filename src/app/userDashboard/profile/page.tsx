"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { CalendarIcon, Globe, Loader2, Mail, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  getMyProfile,
  updateMyProfile,
  uploadUserAvatar,
  type UserProfile,
} from "@/features/users/api"
import {
  normalizePhoneCountryCode,
  profileInitials,
  resolveAvatarSrc,
} from "@/features/users/profile-display"
import { patchAuthUser } from "@/features/auth/session-storage"
import { toastApiError } from "@/lib/toasts"
import { toast } from "sonner"

/** Editable via PUT /api/users/me */
type EditableProfileFields = {
  firstName: string
  lastName: string
  city: string
  state: string
  zipCode: string
  dob: Date | undefined
  avatarUrl: string | null
}

/** Read-only account contact fields (set at registration, not in UpdateUserDto). */
type ReadOnlyContactFields = {
  email: string
  phoneCountryCode: string
  phone: string
}

type ProfileFormState = EditableProfileFields & ReadOnlyContactFields

function profileToForm(profile: UserProfile): ProfileFormState {
  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    email: profile.email ?? "",
    phoneCountryCode: normalizePhoneCountryCode(profile.phoneCountryCode),
    phone: profile.phone ?? "",
    state: profile.state ?? "",
    city: profile.city ?? "",
    zipCode: profile.zipCode ?? "",
    dob: profile.dob ? new Date(profile.dob) : undefined,
    avatarUrl: resolveAvatarSrc(profile.avatarUrl),
  }
}

function displayName(firstName: string, lastName: string) {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim()
  return name || "there"
}

function syncAuthFromProfile(profile: UserProfile) {
  patchAuthUser({
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone ?? undefined,
    phoneCountryCode: profile.phoneCountryCode,
  })
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [form, setForm] = React.useState<ProfileFormState | null>(null)

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getMyProfile,
  })

  React.useEffect(() => {
    if (profile) {
      setForm(profileToForm(profile))
    }
  }, [profile])

  const applyProfileUpdate = (updated: UserProfile) => {
    queryClient.setQueryData(["user-profile"], updated)
    setForm(profileToForm(updated))
    syncAuthFromProfile(updated)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form) throw new Error("Form not ready")
      const body: Parameters<typeof updateMyProfile>[0] = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        zipCode: form.zipCode.trim() || undefined,
      }
      if (form.dob) {
        const d = new Date(form.dob)
        d.setUTCHours(12, 0, 0, 0)
        body.dob = d.toISOString()
      }
      if (form.avatarUrl) {
        body.avatarUrl = form.avatarUrl
      }
      return updateMyProfile(body)
    },
    onSuccess: (updated) => {
      applyProfileUpdate(updated)
      toast.success("Profile updated")
    },
    onError: (err) => {
      toastApiError(err, "Could not save profile.")
    },
  })

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadUserAvatar(file)
      return updateMyProfile({ avatarUrl: url })
    },
    onSuccess: (updated) => {
      applyProfileUpdate(updated)
      toast.success("Profile photo updated")
    },
    onError: (err) => {
      toastApiError(err, "Could not update profile photo.")
    },
  })

  const handleDiscard = () => {
    if (profile) {
      setForm(profileToForm(profile))
    }
  }

  const updateField =
    <K extends keyof EditableProfileFields>(key: K) =>
    (value: EditableProfileFields[K]) => {
      setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
    }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    avatarMutation.mutate(file)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    )
  }

  if (isError || !profile || !form) {
    return (
      <div className="rounded-xl bg-[#121212] p-8 text-center">
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Failed to load profile."}
        </p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    )
  }

  const initials = profileInitials(form.firstName, form.lastName)
  const avatarSrc = form.avatarUrl

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 bg-[#121212] p-6 rounded-lg">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt="Profile photo" />
              ) : null}
              <AvatarFallback className="text-lg bg-[#2a2a2a] text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {avatarMutation.isPending && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <h4 className="text-lg font-medium">
              Hey {displayName(form.firstName, form.lastName)}!
            </h4>
            <p className="text-[#B3B3B3]">{form.email || "—"}</p>
          </div>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarChange}
          />
          <Button
            type="button"
            variant="outline"
            disabled={avatarMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            Change photo
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-[#121212] p-8">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                className="pl-10"
                value={form.firstName}
                onChange={(e) => updateField("firstName")(e.target.value)}
                required
                minLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="lastName"
                className="pl-10"
                value={form.lastName}
                onChange={(e) => updateField("lastName")(e.target.value)}
                required
                minLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                className="pl-10"
                value={form.email}
                readOnly
                disabled
                aria-description="Email cannot be changed here"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="flex gap-2">
              <Input
                id="phoneCountryCode"
                className="w-[100px] shrink-0 font-mono text-center"
                value={form.phoneCountryCode || "—"}
                readOnly
                disabled
                aria-label="Country code"
              />
              <Input
                id="phone"
                className="flex-1"
                value={form.phone || "—"}
                readOnly
                disabled
                aria-label="Phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State / region</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="state"
                className="pl-10"
                placeholder="e.g. California or NY"
                value={form.state}
                onChange={(e) => updateField("state")(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="City"
              value={form.city}
              onChange={(e) => updateField("city")(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">Zip code</Label>
            <Input
              id="zipCode"
              placeholder="Zip / postal code"
              value={form.zipCode}
              onChange={(e) => updateField("zipCode")(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.dob && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.dob ? form.dob.toLocaleDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.dob}
                  onSelect={(date) => updateField("dob")(date)}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={1940}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="col-span-full flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
              disabled={saveMutation.isPending || avatarMutation.isPending}
            >
              Discard
            </Button>
            <Button
              type="submit"
              className="bg-pink-500 hover:bg-pink-600"
              disabled={saveMutation.isPending || avatarMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
