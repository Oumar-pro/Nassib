import { Profile } from '../types';

type Criterion = { weight: number; score: number | null };
const normalize = (value?: string | null) => (value || '').trim().toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const tokens = (value?: string | null): string[] => normalize(value).split(/[\s,;|/]+/).filter(Boolean);
const overlapScore = (a?: string[] | string | null, b?: string[] | string | null): number | null => {
  const aa=Array.isArray(a)?a.flatMap(tokens):tokens(a); const bb=Array.isArray(b)?b.flatMap(tokens):tokens(b);
  if(!aa.length||!bb.length)return null; const setB=new Set(bb);
  return Math.min(1,aa.filter(x=>setB.has(x)).length/Math.max(1,Math.min(aa.length,bb.length)));
};
const exactScore = (a?: string | null,b?: string | null): number | null => { const aa=normalize(a),bb=normalize(b); if(!aa||!bb)return null; return aa===bb?1:0; };
const ageScore = (a?: number | null,b?: number | null): number | null => { if(!Number.isFinite(a)||!Number.isFinite(b))return null; return Math.max(0,1-Math.abs((a as number)-(b as number))/15); };
const booleanScore = (a?: boolean | null,b?: boolean | null): number | null => { if(a==null||b==null)return null; return a===b?1:0; };

export function calculateCompatibility(a: Profile | null | undefined,b: Profile | null | undefined): number {
  if(!a||!b||a.id===b.id)return 0;
  const criteria:Criterion[]=[
    {weight:22,score:exactScore(a.religion,b.religion)},
    {weight:16,score:exactScore(a.maritalStatus,b.maritalStatus)},
    {weight:10,score:exactScore(a.polygamyOpinion,b.polygamyOpinion)},
    {weight:10,score:exactScore(a.familyImportance,b.familyImportance)},
    {weight:10,score:overlapScore(a.values,b.values)},
    {weight:8,score:overlapScore(a.dealBreakers,b.dealBreakers)},
    {weight:6,score:overlapScore(a.interests,b.interests)},
    {weight:5,score:overlapScore(a.hobbies,b.hobbies)},
    {weight:5,score:exactScore(a.city,b.city)},
    {weight:4,score:exactScore(a.originCity,b.originCity)},
    {weight:4,score:ageScore(a.age,b.age)},
    {weight:3,score:exactScore(a.education,b.education)},
    {weight:3,score:exactScore(a.professionCategory,b.professionCategory)},
    {weight:3,score:exactScore(a.bodyType,b.bodyType)},
    {weight:3,score:booleanScore(a.smokes,b.smokes)},
    {weight:3,score:booleanScore(a.drinksAlcohol,b.drinksAlcohol)},
    {weight:3,score:exactScore(a.personality,b.personality)},
  ];
  const available=criteria.filter(c=>c.score!==null); if(!available.length)return 0;
  const total=available.reduce((s,c)=>s+c.weight,0); const weighted=available.reduce((s,c)=>s+(c.score as number)*c.weight,0);
  return Math.round((weighted/total)*100);
}
