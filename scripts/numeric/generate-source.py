#!/usr/bin/env python3
"""Render the reviewed fixed-width LexLean definitions; no target arithmetic."""
import argparse
from pathlib import Path
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output-dir', type=Path, default=Path('prism/numeric/src'))
D=parser.parse_args().output_dir
D.mkdir(parents=True, exist_ok=True)
def lit(n,t='UInt64'): return f'({n} : {t})'
def prim(op,*args,t='UInt64'): return f'(prim {op} {" ".join(args)} : {t})'
def some(x,t): return f'(ctor Option.some [{t}] {x})'
def none(t): return f'(ctor Option.none [{t}])'
def bind(x,n,body,t): return f'(match {x} | Option.some {n} => {body} | Option.none => {none(t)})'
def binds(xs,body,t):
    for n,x in reversed(xs): body=bind(x,n,body,t)
    return body
def lets(xs,body):
    for n,t,x in reversed(xs): body=f'(let {n} : {t} := {x}; {body})'
    return body
def chk(op,*args,t='UInt64'): return prim(op,*args,t=f'(Option {t})')
N=''  # Current module qualification; Float imports the shared Wide helpers.
def conv(x,source,target): return call(N+'convert'+source+'To'+target,x)
def field(n,v='w'): return f'(project {v} {n})'
def call(n,*a): return f'({n} {" ".join(a)})'
def eq(a,b): return prim('equal',a,b,t='Bool')
def lt(a,b): return call('Wide::unsignedLess',a,b)
def slt(a,b): return call('Wide::signedLess',a,b)
I='Int16'
def ilit(n): return lit(n,I)
def ichk(op,*args): return call(N+'int16'+op.capitalize(),*args)
def repeated(name,typ,maximum):
    # Named first-order composition: no runtime closures or Nat counts.
    result=''; previous=name+'Step'; count=2
    while count<=maximum:
        current=name+str(count)
        result+=defi(current,f'state : (Option {typ})',f'(Option {typ})',call(previous,call(previous,'state')))
        previous=current; count*=2
    return result
def repeat(name,count,state):
    for bit in range(count.bit_length()):
        if count & (1<<bit): state=call(name+('Step' if bit==0 else str(1<<bit)),state)
    return state
def cond(c,a,b): return f'(if {c} then {a} else {b})'
def defi(name,ps,res,body,prod=False): return f'definition{{\n name: {name}, parameters: [{ps}], result: {res},\n body: {body},\n axioms: [Quot.sound, propext], executable: true'+(', production: {effects: [overflow], targets: [rust-std]}' if prod else '')+'\n}\n'
def module(name,body,imports=''): return '\\begin{lexlean}{'+name+'}\n\\useglossary{lexlean.std.nat@1.2.0}\n'+imports+'\\title{addition}\n\\begin{semanticmodule}\n'+body+'\\end{semanticmodule}\n\\end{lexlean}\n'
W='Limbs'; U='UInt64'; B=lit(4294967295); Z=lit(0); O=lit(1)
s=''
# Function signatures retain fixed scalar types at the canonical Rust boundary.
CONVERSIONS=[('UInt64','UInt8'),('UInt64','UInt16'),('UInt64','UInt32'),('UInt32','UInt64'),('UInt8','Int16'),('UInt16','Int16'),('Int16','UInt8'),('Int16','UInt16'),('Int16','UInt32'),('Int16','UInt64')]
for source,target in CONVERSIONS:
    s+=defi('convert'+source+'To'+target,f'value : {source}',f'(Option {target})',chk('checked_convert','value',t=target))
for op in ['add','subtract','negate']:
    operands=['a'] if op=='negate' else ['a','b']
    s+=defi('int16'+op.capitalize(),', '.join(v+' : Int16' for v in operands),'(Option Int16)',chk('checked_'+op,*operands,t=I))
s+='structure{ name: Limbs, type_parameters: [], parameters: [], fields: ['+', '.join('{name: l'+str(i)+', type: UInt32}' for i in range(4))+'] }\n'
# Full 64x64 product: every checked multiply/add/narrow failure survives.
xs=[]
for name,v,high in [('a0','a',False),('a1','a',True),('b0','b',False),('b1','b',True)]:
    xs.append((name,chk('shift_right',v,lit(32,'UInt32')) if high else some(prim('bit_and',v,B),U)))
xs += [('t0',chk('checked_multiply','a0','b0')),('c0',chk('shift_right','t0',lit(32,'UInt32'))),('m1',chk('checked_multiply','a1','b0')),('t1',chk('checked_add','m1','c0')),('m2',chk('checked_multiply','a0','b1')),('t2',chk('checked_add','m2',prim('bit_and','t1',B))),('c1',chk('shift_right','t1',lit(32,'UInt32'))),('c2',chk('shift_right','t2',lit(32,'UInt32'))),('m3',chk('checked_multiply','a1','b1')),('u3',chk('checked_add','m3','c1')),('t3',chk('checked_add','u3','c2')),('top',chk('shift_right','t3',lit(32,'UInt32')))]
for i,v in enumerate(['t0','t2','t3','top']): xs.append(('r'+str(i),conv(prim('bit_and',v,B),U,'UInt32')))
s+=defi('multiply','a : UInt64, b : UInt64','(Option Limbs)',binds(xs,some('(record Limbs {'+', '.join(f'l{i} := r{i}' for i in range(4))+'})',W),W))
xs=[]
for i in range(4): xs.append((f'q{i}',chk('shift_right',field('l'+str(i)),lit(1,'UInt32'),t='UInt32')))
for i in range(3): xs.append((f'c{i}',chk('shift_left',prim('bit_and',field('l'+str(i+1)),lit(1,'UInt32'),t='UInt32'),lit(31,'UInt32'),t='UInt32')))
s+=defi('right','w : Limbs','(Option Limbs)',binds(xs,some('(record Limbs {'+', '.join(f'l{i} := '+(prim('bit_or',f'q{i}',f'c{i}',t='UInt32') if i<3 else 'q3') for i in range(4))+'})',W),W))
s+=defi('low64','w : Limbs','(Option UInt64)',cond(f'({eq(field("l2"),lit(0,"UInt32"))} && {eq(field("l3"),lit(0,"UInt32"))})',binds([('lo',conv(field('l0'),'UInt32',U)),('hi',conv(field('l1'),'UInt32',U)),('sh',chk('shift_left','hi',lit(32,'UInt32')))],some(prim('bit_or','lo','sh'),U),U),none(U)))
# Unsigned subtraction refuses exactly when the left operand is smaller.
# No generic Key/lessThan dictionary is needed by the canonical exporter.
s+=defi('unsignedLess','a : UInt64, b : UInt64','Bool',f'(match {chk("checked_subtract","a","b")} | Option.some difference => false | Option.none => true)')
# Checked conversion to UInt16 fails exactly on negative Int16 values.
s+=defi('negative','a : Int16','Bool',f'(match {conv("a",I,"UInt16")} | Option.some nonnegative => false | Option.none => true)')
# Only opposite-sign subtraction can overflow; its left sign is the order.
s+=defi('signedLess','a : Int16, b : Int16','Bool',f'(match {ichk("subtract","a","b")} | Option.some difference => (negative difference) | Option.none => (negative a))')
# lengthStep's explicit Int16 counter remains checked for arbitrary callers.
T='LengthState'
s+='structure{ name: LengthState, type_parameters: [], parameters: [], fields: [{name: word, type: UInt32}, {name: count, type: Int16}] }\n'
def length_state(word,count): return some('(record LengthState {word := '+word+', count := '+count+'})',T)
increment=bind(ichk('add',field('count','st'),ilit(1)),'count',length_state('next','count'),T)
step=bind('state','st',bind(chk('shift_right',field('word','st'),lit(1,'UInt32'),t='UInt32'),'next',cond(eq(field('word','st'),lit(0,'UInt32')),length_state('next',field('count','st')),increment),T),T)
s+=defi('lengthStep',f'state : (Option {T})',f'(Option {T})',step)
s+=repeated('length',T,16)
s+=defi('length32Steps',f'state : (Option {T})',f'(Option {T})',call('length16',call('length16','state')))
loop=call('length32Steps',length_state('v',ilit(0)))
s+=defi('length32','v : UInt32','(Option Int16)',bind(loop,'st',some(field('count','st'),I),I))
length=call('length32',field('l0'))
for i in range(1,4):
    length=cond(eq(field('l'+str(i)),lit(0,'UInt32')),length,bind(call('length32',field('l'+str(i))),'n',ichk('add','n',ilit(32*i)),I))
s+=defi('length','w : Limbs','(Option Int16)',length)
s+='structure{ name: Rounding, type_parameters: [], parameters: [], fields: [{name: value, type: Limbs}, {name: guard, type: Bool}, {name: sticky, type: Bool}] }\n'
s+=defi('roundStep','state : (Option Rounding)','(Option Rounding)',bind('state','st',bind(call('right',field('value','st')),'next',some('(record Rounding {value := next, guard := '+eq(prim('bit_and',field('l0',field('value','st')),lit(1,'UInt32'),t='UInt32'),lit(1,'UInt32'))+', sticky := ('+field('sticky','st')+' || '+field('guard','st')+')})','Rounding'),'Rounding'),'Rounding'))
s+=repeated('round','Rounding',128)
initial=some('(record Rounding {value := w, guard := false, sticky := false})','Rounding')
# Decompose the finite count into eight named first-order compositions.
round_bindings=[('state0',initial)]
for bit in range(8):
    n=1<<bit; previous='state'+str(bit)
    apply=call('round'+('Step' if bit==0 else str(n)),some(previous,'Rounding'))
    selected=cond(eq(prim('bit_and','count',lit(n,'UInt8'),t='UInt8'),lit(0,'UInt8')),some(previous,'Rounding'),apply)
    round_bindings.append(('state'+str(bit+1),selected))
loop=binds(round_bindings,some('state8','Rounding'),'Rounding')
rounded=binds([('st',loop),('bits',call('low64',field('value','st')))],cond(f'({field("guard","st")} && ({field("sticky","st")} || {eq(prim("bit_and","bits",O),O)}))',chk('checked_add','bits',O),some('bits',U)),U)
pos=cond(call('signedLess',ilit(128),'amount'),some(Z,U),bind(conv('amount',I,'UInt8'),'count',rounded,U))
neg=binds([('positive',ichk('negate','amount')),('count',conv('positive',I,'UInt32')),('bits',call('low64','w'))],chk('shift_left','bits','count'),U)
s+=defi('round','w : Limbs, amount : Int16','(Option UInt64)',cond(call('negative','amount'),neg,pos))
# Exact 64-bit embedding keeps the canonical four-UInt32-limb representation.
s+=defi('from64','v : UInt64','(Option Limbs)',binds([('lo',conv(prim('bit_and','v',B),U,'UInt32')),('upper',chk('shift_right','v',lit(32,'UInt32'))),('hi',conv('upper',U,'UInt32'))],some('(record Limbs {l0 := lo, l1 := hi, l2 := (0 : UInt32), l3 := (0 : UInt32)})',W),W))
# Bounded quotient recurrence: r < d <= 2^53-1; 2*r < 2^54.
# q starts at 1, so 54 steps produce at most 55 bits. No wide Nat division.
s+='structure{ name: Division, type_parameters: [], parameters: [], fields: [{name: quotient, type: UInt64}, {name: remainder, type: UInt64}, {name: divisor, type: UInt64}] }\n'
R='Division'
def division_state(q,r): return some('(record Division {quotient := '+q+', remainder := '+r+', divisor := '+field('divisor','st')+'})',R)
# Underflow of unsigned subtraction is intentionally the comparison result.
branch='(match '+chk('checked_subtract','twice',field('divisor','st'))+' | Option.some reduced => '+bind(chk('checked_add','q2',O),'nextq',division_state('nextq','reduced'),R)+' | Option.none => '+division_state('q2','twice')+')'
s+=defi('divideStep','state : (Option Division)','(Option Division)',binds([('st','state'),('twice',chk('checked_multiply',field('remainder','st'),lit(2))),('q2',chk('checked_multiply',field('quotient','st'),lit(2)))],branch,R))
s+=repeated('divide',R,32)
for width,steps in [(32,25),(64,54)]:
    initial=some('(record Division {quotient := (1 : UInt64), remainder := initial, divisor := b})',R)
    loop=repeat('divide',steps,initial)
    jam=prim('bit_or',field('quotient','st'),cond(eq(field('remainder','st'),Z),Z,O))
    s+=defi(f'quotient{width}','a : UInt64, b : UInt64','(Option UInt64)',binds([('initial',chk('checked_subtract','a','b')),('st',loop)],some(jam,U),U))
D.joinpath('Wide.lex.tex').write_text(module('Wide',s))
# Separate concrete formats: no arbitrary format parameters on public roots.
N='Wide::'
s=''
for width,f,eb in [(32,23,8),(64,52,11)]:
    bias=(1<<(eb-1))-1; em=(1<<eb)-1; fm=(1<<f)-1; sign=1<<(width-1); inf=em<<f; quiet=1<<(f-1)
    vals=[('sg',U,prim('bit_and',prim('bit_xor','a','b'),lit(sign))),('fa',U,prim('bit_and','a',lit(fm))),('fb',U,prim('bit_and','b',lit(fm)))]
    expxs=[('sa',chk('shift_right','a',lit(f,'UInt32'))),('sb',chk('shift_right','b',lit(f,'UInt32')))]
    expvals=[('ea',U,prim('bit_and','sa',lit(em))),('eb',U,prim('bit_and','sb',lit(em)))]
    sigvals=[('ma',U,cond(eq('ea',Z),'fa',prim('bit_or','fa',lit(1<<f)))),('mb',U,cond(eq('eb',Z),'fb',prim('bit_or','fb',lit(1<<f))))]
    # Preserve the original checked format-field narrowing before Int16.
    exponents=[('smallA',conv('ea',U,'UInt8' if width==32 else 'UInt16')),('smallB',conv('eb',U,'UInt8' if width==32 else 'UInt16')),('xa',cond(eq('ea',Z),some(ilit(1),I),conv('smallA','UInt8' if width==32 else 'UInt16',I))),('xb',cond(eq('eb',Z),some(ilit(1),I),conv('smallB','UInt8' if width==32 else 'UInt16',I)))]
    scale=[('sum',ichk('add','xa','xb')),('scale',ichk('subtract','sum',ilit(2*bias+2*f)))]
    # unit shift = max(product top - f, emin - f - scale)
    round_bindings=[('top',ichk('subtract','height',ilit(1))),('exponent',ichk('add','top','scale')),('normalShift',ichk('subtract','top',ilit(f))),('subShift',ichk('subtract',ilit(1-bias-f),'scale'))]
    amount=cond(slt('normalShift','subShift'),'subShift','normalShift')
    adjusted=cond('overflow',ichk('add','exponent',ilit(1)),some('exponent',I))
    expbits=cond(slt('adjusted',ilit(1-bias)),some(cond(lt('rounded',lit(1<<f)),ilit(0),ilit(1)),I),ichk('add','adjusted',ilit(bias)))
    pack=binds([('frac',cond('overflow',chk('shift_right','rounded',lit(1,'UInt32')),some('rounded',U))),('enc',conv('expbits',I,U)),('shifted',chk('shift_left','enc',lit(f,'UInt32')))],some(prim('bit_or','sg',prim('bit_or','shifted',prim('bit_and','frac',lit(fm)))),U),U)
    pack=lets([('overflow','Bool',eq('rounded',lit(1<<(f+1))))],binds([('adjusted',adjusted),('expbits',expbits)],cond(slt(ilit(em-1),'expbits'),some(prim('bit_or','sg',lit(inf)),U),pack),U))
    # Keep packing first-order and shared, while bounding canonical IR nesting.
    # All checked carry, exponent conversion and shift refusals stay in the body.
    s+=defi(f'pack{width}','sg : UInt64, rounded : UInt64, exponent : Int16','(Option UInt64)',pack)
    pack=call(f'pack{width}','sg','rounded','exponent')
    finite=lets(sigvals,binds(exponents+scale+[('product',call('Wide::multiply','ma','mb')),('height',call('Wide::length','product'))]+round_bindings,lets([('amount',I,amount)],bind(call('Wide::round','product','amount'),'rounded',pack,U)),U))
    zero=f'({eq(prim("bit_and","a",lit(sign-1)),Z)} || {eq(prim("bit_and","b",lit(sign-1)),Z)})'
    special=cond(f'({eq("ea",lit(em))} && (not {eq("fa",Z)}))',some(prim('bit_or','a',lit(quiet)),U),cond(f'({eq("eb",lit(em))} && (not {eq("fb",Z)}))',some(prim('bit_or','b',lit(quiet)),U),cond(f'({eq("ea",lit(em))} || {eq("eb",lit(em))})',some(cond(zero,lit(inf|quiet),prim('bit_or','sg',lit(inf))),U),cond(zero,some('sg',U),finite))))
    body=lets(vals,binds(expxs,lets(expvals,special),U))
    s+=defi(f'bits{width}','a : UInt64, b : UInt64','(Option UInt64)',body)
    if width==64: root=call('bits64','a','b')
    else: root=binds([('wa',conv('a','UInt32',U)),('wb',conv('b','UInt32',U)),('r',call('bits32','wa','wb'))],conv('r',U,'UInt32'),'UInt32')
    s+=defi(f'mul{width}',f'a : UInt{width}, b : UInt{width}',f'(Option UInt{width})',root,True)
    # Division normalizes each nonzero significand separately, then emits f+3
    # quotient bits with remainder sticky information and rounds exactly once.
    normalized=[('wa',call('Wide::from64','ma')),('wb',call('Wide::from64','mb')),('ha',call('Wide::length','wa')),('hb',call('Wide::length','wb')),('distanceA',ichk('subtract',ilit(f+1),'ha')),('distanceB',ichk('subtract',ilit(f+1),'hb')),('shiftA',conv('distanceA',I,'UInt32')),('shiftB',conv('distanceB',I,'UInt32')),('na',chk('shift_left','ma','shiftA')),('nb',chk('shift_left','mb','shiftB'))]
    div_bindings=[('difference',ichk('subtract','xa','xb')),('heightDifference',ichk('subtract','hb','ha')),('delta',ichk('subtract','difference','heightDifference')),('exponent',cond('below',ichk('subtract','delta',ilit(1)),some('delta',I))),('subShift',ichk('subtract',ilit(3-bias),'exponent'))]
    quotient=[('numerator',cond('below',chk('shift_left','na',lit(1,'UInt32')),some('na',U))),('quotient',call(f'Wide::quotient{width}','numerator','nb')),('value',call('Wide::from64','quotient')),('rounded',call('Wide::round','value','amount'))]
    divfinite=lets(sigvals,binds(exponents+normalized,lets([('below','Bool',lt('na','nb'))],binds(div_bindings,lets([('amount',I,cond(slt(ilit(2),'subShift'),'subShift',ilit(2)))],binds(quotient,pack,U)),U)),U))
    za=eq(prim('bit_and','a',lit(sign-1)),Z); zb=eq(prim('bit_and','b',lit(sign-1)),Z)
    ia=eq('ea',lit(em)); ib=eq('eb',lit(em))
    invalid=f'(({za} && {zb}) || ({ia} && {ib}))'
    divspecial=cond(f'({ia} && (not {eq("fa",Z)}))',some(prim('bit_or','a',lit(quiet)),U),cond(f'({ib} && (not {eq("fb",Z)}))',some(prim('bit_or','b',lit(quiet)),U),cond(invalid,some(lit(inf|quiet),U),cond(f'({ia} || {zb})',some(prim('bit_or','sg',lit(inf)),U),cond(f'({ib} || {za})',some('sg',U),divfinite)))))
    s+=defi(f'divBits{width}','a : UInt64, b : UInt64','(Option UInt64)',lets(vals,binds(expxs,lets(expvals,divspecial),U)))
    divroot=call('divBits64','a','b') if width==64 else binds([('wa',conv('a','UInt32',U)),('wb',conv('b','UInt32',U)),('r',call('divBits32','wa','wb'))],conv('r',U,'UInt32'),'UInt32')
    s+=defi(f'div{width}',f'a : UInt{width}, b : UInt{width}',f'(Option UInt{width})',divroot,True)

D.joinpath('Float.lex.tex').write_text(module('Float',s,'\\importmodule{Wide}\n'))
