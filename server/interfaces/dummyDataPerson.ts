type DateObject = {
  year: number
  month: number
  day: number
  hour?: number
  minute?: number
  second?: number
}

export type CurfewSchedule = {
  curfew_days: number[]
  curfew_duration: number
  start_time: { hour: number; minute: number; second: number }
  end_time: { hour: number; minute: number; second: number }
}

export type Person = {
  delius_id: string
  first_name: string
  middle_name: string | null
  last_name: string
  date_of_birth: DateObject
  gender: string
  alias: string | null
  marital_status: string
  disabilities_and_health_conditions: string
  primary_address_house_number_and_street_name: string
  primary_address_city_town: string
  primary_address_county: string | null
  primary_address_country: string
  primary_address_postcode: string
  phone_mobile_number: string
  additional_phone_number: string
  responsible_officer_name: string
  responsible_officer_phone_number: string
  responsible_officer_email: string
  offence: string
  offence_additional_details: string | null
  order_type: string
  order_type_description: string
  enforceable_condition: string
  licence_condition_details: string
  order_start_date: DateObject
  order_end_date: DateObject
  device_installed_date_time: DateObject
  release_date: DateObject
  notifying_organisation: string
  notifying_organisation_name: string
  tag_model: string
  tag_serial_number: number
  hmu_model: string
  curfew_schedule: CurfewSchedule[]
}

export type FormattedPerson = Person & {
  full_name: string
  date_of_birth_string: string
  disabilities: string[]
  order_start_date_string: string
  order_end_date_string: string
  order_days_left: string
  device_installed_date_time_string: string
  release_date_string: string
  curfew: { key: string; value: string }[]
}

export const dayMap: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
}
