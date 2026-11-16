#!/usr/bin/env python3
"""Render the reviewed fixed-width LexLean definitions; no target arithmetic."""
from pathlib import Path
D=Path('prism/numeric/src')
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
def conv(x,t='UInt64'): return chk('checked_convert',x,t=t)
def field(n,v='w'): return f'(project {v} {n})'
def call(n,*a): return f'({n} {" ".join(a)})'
def eq(a,b): return prim('equal',a,b,t='Bool')
def lt(a,b): return prim('less_than',a,b,t='Bool')
def cond(c,a,b): return f'(if {c} then {a} else {b})'
def defi(name,ps,res,body,prod=False): return f'definition{{\n name: {name}, parameters: [{ps}], result: {res},\n body: {body},\n axioms: [Quot.sound, propext], executable: true'+(', production: {effects: [overflow], targets: [rust-std]}' if prod else '')+'\n}\n'
def module(name,body,imports=''): return '\\begin{lexlean}{'+name+'}\n\\useglossary{lexlean.std.nat@1.2.0}\n'+imports+'\\title{addition}\n\\begin{semanticmodule}\n'+body+'\\end{semanticmodule}\n\\end{lexlean}\n'
W='Limbs'; U='UInt64'; B=lit(4294967295); Z=lit(0); O=lit(1)
s='structure{ name: Limbs, type_parameters: [], parameters: [], fields: ['+', '.join('{name: l'+str(i)+', type: UInt32}' for i in range(4))+'] }\n'
# Full 64x64 product: every checked multiply/add/narrow failure survives.
xs=[]
for name,v,high in [('a0','a',False),('a1','a',True),('b0','b',False),('b1','b',True)]:
    xs.append((name,chk('shift_right',v,lit(32,'UInt32')) if high else some(prim('bit_and',v,B),U)))
xs += [('t0',chk('checked_multiply','a0','b0')),('c0',chk('shift_right','t0',lit(32,'UInt32'))),('m1',chk('checked_multiply','a1','b0')),('t1',chk('checked_add','m1','c0')),('m2',chk('checked_multiply','a0','b1')),('t2',chk('checked_add','m2',prim('bit_and','t1',B))),('c1',chk('shift_right','t1',lit(32,'UInt32'))),('c2',chk('shift_right','t2',lit(32,'UInt32'))),('m3',chk('checked_multiply','a1','b1')),('u3',chk('checked_add','m3','c1')),('t3',chk('checked_add','u3','c2')),('top',chk('shift_right','t3',lit(32,'UInt32')))]
for i,v in enumerate(['t0','t2','t3','top']): xs.append(('r'+str(i),conv(prim('bit_and',v,B),'UInt32')))
s+=defi('multiply','a : UInt64, b : UInt64','(Option Limbs)',binds(xs,some('(record Limbs {'+', '.join(f'l{i} := r{i}' for i in range(4))+'})',W),W))
xs=[]
for i in range(4): xs.append((f'q{i}',chk('shift_right',field('l'+str(i)),lit(1,'UInt32'),t='UInt32')))
for i in range(3): xs.append((f'c{i}',chk('shift_left',prim('bit_and',field('l'+str(i+1)),lit(1,'UInt32'),t='UInt32'),lit(31,'UInt32'),t='UInt32')))
s+=defi('right','w : Limbs','(Option Limbs)',binds(xs,some('(record Limbs {'+', '.join(f'l{i} := '+(prim('bit_or',f'q{i}',f'c{i}',t='UInt32') if i<3 else 'q3') for i in range(4))+'})',W),W))
s+=defi('low64','w : Limbs','(Option UInt64)',cond(f'({eq(field("l2"),lit(0,"UInt32"))} && {eq(field("l3"),lit(0,"UInt32"))})',binds([('lo',conv(field('l0'))),('hi',conv(field('l1'))),('sh',chk('shift_left','hi',lit(32,'UInt32')))],some(prim('bit_or','lo','sh'),U),U),none(U)))
# A bounded fixed-width bit length, with every shift failure propagated.
T='(UInt32 * Int)'
step=bind('state','st',bind(chk('shift_right','(first st)',lit(1,'UInt32'),t='UInt32'),'next',some('(next, '+cond(eq('(first st)',lit(0,'UInt32')),'(second st)','(prim subtract (second st) (-1 : Int) : Int)')+')',T),T),T)
s+=defi('lengthStep','state : (Option (UInt32 * Int))','(Option (UInt32 * Int))',step)
loop='(prim iterate (fun (state : (Option (UInt32 * Int))) => (lengthStep state)) 32 '+some('(v, (0 : Int))',T)+' : (Option (UInt32 * Int)))'
s+=defi('length32','v : UInt32','(Option Int)',bind(loop,'st',some('(second st)','Int'),'Int'))
length=call('length32',field('l0'))
for i in range(1,4):
    length=cond(eq(field('l'+str(i)),lit(0,'UInt32')),length,bind(call('length32',field('l'+str(i))),'n',some(f'(prim subtract n ({-32*i} : Int) : Int)','Int'),'Int'))
s+=defi('length','w : Limbs','(Option Int)',length)
s+='structure{ name: Rounding, type_parameters: [], parameters: [], fields: [{name: value, type: Limbs}, {name: guard, type: Bool}, {name: sticky, type: Bool}] }\n'
s+=defi('roundStep','state : (Option Rounding)','(Option Rounding)',bind('state','st',bind(call('right',field('value','st')),'next',some('(record Rounding {value := next, guard := '+eq(prim('bit_and',field('l0',field('value','st')),lit(1,'UInt32'),t='UInt32'),lit(1,'UInt32'))+', sticky := ('+field('sticky','st')+' || '+field('guard','st')+')})','Rounding'),'Rounding'),'Rounding'))
initial=some('(record Rounding {value := w, guard := false, sticky := false})','Rounding')
loop=f'(prim iterate (fun (state : (Option Rounding)) => (roundStep state)) (prim to_nat count : Nat) {initial} : (Option Rounding))'
rounded=binds([('st',loop),('bits',call('low64',field('value','st')))],cond(f'({field("guard","st")} && ({field("sticky","st")} || {eq(prim("bit_and","bits",O),O)}))',chk('checked_add','bits',O),some('bits',U)),U)
pos=cond(lt('(128 : Int)','amount'),some(Z,U),bind(conv('amount','UInt8'),'count',rounded,U))
neg=binds([('count',conv(prim('negate','amount',t='Int'),'UInt32')),('bits',call('low64','w'))],chk('shift_left','bits','count'),U)
s+=defi('round','w : Limbs, amount : Int','(Option UInt64)',cond(lt('amount','(0 : Int)'),neg,pos))
D.joinpath('Wide.lex.tex').write_text(module('Wide',s))
# Separate concrete formats: no arbitrary format parameters on public roots.
s=''
for width,f,eb in [(32,23,8),(64,52,11)]:
    bias=(1<<(eb-1))-1; em=(1<<eb)-1; fm=(1<<f)-1; sign=1<<(width-1); inf=em<<f; quiet=1<<(f-1)
    vals=[('sg',U,prim('bit_and',prim('bit_xor','a','b'),lit(sign))),('fa',U,prim('bit_and','a',lit(fm))),('fb',U,prim('bit_and','b',lit(fm)))]
    expxs=[('sa',chk('shift_right','a',lit(f,'UInt32'))),('sb',chk('shift_right','b',lit(f,'UInt32')))]
    expvals=[('ea',U,prim('bit_and','sa',lit(em))),('eb',U,prim('bit_and','sb',lit(em)))]
    sigvals=[('ma',U,cond(eq('ea',Z),'fa',prim('bit_or','fa',lit(1<<f)))),('mb',U,cond(eq('eb',Z),'fb',prim('bit_or','fb',lit(1<<f)))),('xa','Int',cond(eq('ea',Z),'(1 : Int)',prim('to_int','smallA',t='Int'))),('xb','Int',cond(eq('eb',Z),'(1 : Int)',prim('to_int','smallB',t='Int'))),('scale','Int',f'(prim subtract (prim subtract xa (prim negate xb : Int) : Int) ({2*bias+2*f} : Int) : Int)')]
    # unit shift = max(product top - f, emin - f - scale)
    roundvals=[('top','Int',f'(prim subtract height (1 : Int) : Int)'),('exponent','Int','(prim subtract top (prim negate scale : Int) : Int)'),('normalShift','Int',f'(prim subtract top ({f} : Int) : Int)'),('subShift','Int',f'(prim subtract ({1-bias-f} : Int) scale : Int)'),('amount','Int',cond(lt('normalShift','subShift'),'subShift','normalShift'))]
    packvals=[('overflow','Bool',eq('rounded',lit(1<<(f+1)))),('adjusted','Int',cond('overflow','(prim subtract exponent (-1 : Int) : Int)','exponent')),('expbits','Int',cond(lt('adjusted',f'({1-bias} : Int)'),cond(lt('rounded',lit(1<<f)),'(0 : Int)','(1 : Int)'),f'(prim subtract adjusted ({-bias} : Int) : Int)'))]
    pack=binds([('frac',cond('overflow',chk('shift_right','rounded',lit(1,'UInt32')),some('rounded',U))),('enc',conv('expbits')),('shifted',chk('shift_left','enc',lit(f,'UInt32')))],some(prim('bit_or','sg',prim('bit_or','shifted',prim('bit_and','frac',lit(fm)))),U),U)
    pack=lets(packvals,cond(lt(f'({em-1} : Int)','expbits'),some(prim('bit_or','sg',lit(inf)),U),pack))
    finite=binds([('smallA',conv('ea','UInt8' if width==32 else 'UInt16')),('smallB',conv('eb','UInt8' if width==32 else 'UInt16'))],lets(sigvals,binds([('product',call('Wide::multiply','ma','mb')),('height',call('Wide::length','product'))],lets(roundvals,bind(call('Wide::round','product','amount'),'rounded',pack,U)),U)),U)
    zero=f'({eq(prim("bit_and","a",lit(sign-1)),Z)} || {eq(prim("bit_and","b",lit(sign-1)),Z)})'
    special=cond(f'({eq("ea",lit(em))} && (not {eq("fa",Z)}))',some(prim('bit_or','a',lit(quiet)),U),cond(f'({eq("eb",lit(em))} && (not {eq("fb",Z)}))',some(prim('bit_or','b',lit(quiet)),U),cond(f'({eq("ea",lit(em))} || {eq("eb",lit(em))})',some(cond(zero,lit(inf|quiet),prim('bit_or','sg',lit(inf))),U),cond(zero,some('sg',U),finite))))
    body=lets(vals,binds(expxs,lets(expvals,special),U))
    s+=defi(f'bits{width}','a : UInt64, b : UInt64','(Option UInt64)',body)
    if width==64: root=call('bits64','a','b')
    else: root=binds([('wa',conv('a')),('wb',conv('b')),('r',call('bits32','wa','wb'))],conv('r','UInt32'),'UInt32')
    s+=defi(f'mul{width}',f'a : UInt{width}, b : UInt{width}',f'(Option UInt{width})',root,True)
D.joinpath('Float.lex.tex').write_text(module('Float',s,'\\importmodule{Wide}\n'))
