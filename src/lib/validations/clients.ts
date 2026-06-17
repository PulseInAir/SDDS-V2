import { z } from 'zod'

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

export const clientFormSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  pan_uppercase: z
    .string()
    .length(10, 'PAN must be 10 characters')
    .regex(panRegex, 'Invalid PAN format')
    .transform((val) => val.toUpperCase()),
  date_of_birth: z.string().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  family_group: z.string().optional().or(z.literal('')),
  active: z.boolean(),
  follow_up_excluded: z.boolean(),
  exclusion_reason: z.string().optional().or(z.literal('')),
})

export type ClientFormData = z.infer<typeof clientFormSchema>
