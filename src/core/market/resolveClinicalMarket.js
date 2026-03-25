import { isSpainPilot } from '../pilotDetection';
const CANADIAN_MARKET = {
    market: 'CA',
    locale: 'en-CA',
    jurisdiction: 'CA-ON',
};
const SPANISH_MARKET = {
    market: 'ES',
    locale: 'es-ES',
    jurisdiction: 'ES-ES',
};
export function resolveClinicalMarket(options) {
    const explicitSpainPilot = options?.isSpainPilotEnabled;
    if (typeof explicitSpainPilot === 'boolean') {
        return explicitSpainPilot ? SPANISH_MARKET : CANADIAN_MARKET;
    }
    const spainPilotEnabled = isSpainPilot();
    if (spainPilotEnabled) {
        return SPANISH_MARKET;
    }
    return CANADIAN_MARKET;
}
