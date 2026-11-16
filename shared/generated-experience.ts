// Generated from model/evolution/state.json. Do not edit.
import {qualityStep,type QualityState} from './experience';
export const experiencePolicy={"recoveryMs":280,"voices":16,"downMs":2400,"upMs":10000} as const;
export const recoveredBurst=(idleSeconds:number)=>idleSeconds*1000>=experiencePolicy.recoveryMs;
export const adaptQuality=(state:QualityState,dt:number)=>qualityStep(state,dt,experiencePolicy);
export const admitVoice=(active:number)=>Number.isInteger(active)&&active>=0&&active<experiencePolicy.voices;
