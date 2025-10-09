import {
  getNameFromPersonObject,
  getDateStringFromDateObject,
  getDOBInformationFromDateObject,
  getDisabilitiesList,
} from './dummyDataUtils'
import { Person, CurfewSchedule } from '../interfaces/dummyDataPerson'

describe('getNameFromPersonObject', () => {
  const person = {
    first_name: 'First Name',
    last_name: 'Last Name',
  } as Person
  const personWithMiddleName = {
    first_name: 'First Name',
    middle_name: 'Middle Name',
    last_name: 'Last Name',
  } as Person
  it('should return First Name and Last Name when provided', () => {
    expect(getNameFromPersonObject(person)).toEqual('First Name Last Name')
  })
  it('should return First Name and Last Name when provided', () => {
    expect(getNameFromPersonObject(personWithMiddleName)).toEqual('First Name Middle Name Last Name')
  })
})

describe('getDateStringFromDateObject', () => {
  it('should return a formatted date string', () => {
    const dateObj = { year: 2024, month: 3, day: 15 }
    expect(getDateStringFromDateObject(dateObj)).toEqual('Friday, 15 March 2024')
  })
})

describe('getDOBInformationFromDateObject', () => {
  it('should return a formatted date of birth string with age', () => {
    const dateObj = { year: 1990, month: 6, day: 20 }
    const result = getDOBInformationFromDateObject(dateObj)
    // The exact age will depend on the current date, so we check the format
    expect(result).toMatch(/20 June 1990 \(\d+ years old\)/)
  })
})

describe('getDOBInformationFromDateObject for leap year', () => {
  it('should correctly calculate age for someone born on Feb 29', () => {
    const dateObj = { year: 2000, month: 2, day: 29 }
    const result = getDOBInformationFromDateObject(dateObj)
    // The exact age will depend on the current date, so we check the format
    expect(result).toMatch(/29 February 2000 \(\d+ years old\)/)
  })
})

describe('getDisabilitiesList', () => {
  it('should return a list of disabilities when provided in array format', () => {
    const disabilities = "['Learning, understanding or concentrating', 'Other']"
    expect(getDisabilitiesList(disabilities)).toEqual(['Learning, understanding or concentrating', 'Other'])
  })
  it('should return a single-item list when provided a single disability', () => {
    const disabilities = 'Mental health'
    expect(getDisabilitiesList(disabilities)).toEqual(['Mental health'])
  })
})
