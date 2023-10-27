import { describe, expect, test } from 'vitest'
import { extractDates } from './worker'


describe('extractDates', () => {
    // "2023年10月25日 18時00分 ～",
    // "2023年10月19日 12:00 ～",
    // "2023年09月07日 22時00分 ～ 2023年10月10日 18時00分",
    // "2023年9月7日 22時00分 ～ 2023年10月10日 18時00分"
    test('extracts dates from sale period text', () => {
        expect(extractDates("2023年10月25日 18時00分 ～")).toEqual({
            startDate: new Date('2023-10-25T18:00:00+09:00'),
            endDate: null,
        })
        expect(extractDates("2023年10月19日 12:00 ～")).toEqual({
            startDate: new Date('2023-10-19T12:00:00+09:00'),
            endDate: null,
        })
        expect(extractDates("2023年09月07日 22時00分 ～ 2023年10月10日 18時00分")).toEqual({
            startDate: new Date('2023-09-07T22:00:00+09:00'),
            endDate: new Date('2023-10-10T18:00:00+09:00'),
        })
        expect(extractDates("2023年9月7日 22時00分 ～ 2023年10月10日 18時00分")).toEqual({
            startDate: new Date('2023-09-07T22:00:00+09:00'),
            endDate: new Date('2023-10-10T18:00:00+09:00'),
        })
    })
})