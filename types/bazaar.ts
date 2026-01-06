export interface BazaarSchedule {
  id: string
  mess_id: string
  month_id: string
  date: string
  status: 'pending' | 'completed'
  shopping_list: string | null
  created_by: string
  created_at: string
  shoppers: BazaarShopper[]
}

export interface BazaarShopper {
  id: string
  schedule_id: string
  user_id: string
  profile?: {
    name: string
    email: string
    avatar_url: string
  }
}
