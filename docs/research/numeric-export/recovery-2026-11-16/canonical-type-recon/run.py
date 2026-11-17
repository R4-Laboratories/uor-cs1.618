from pathlib import Path
import os,subprocess,json,hashlib
r=Path('/workspace/diagnostic-tools/type-recon'); w=r/'lean-work'; w.mkdir(exist_ok=True)
f=r/'source/.lexlean/build/141f738743296ed2cbf7107c78b267ff6703b6023974b013af7a8d1c14c6708d'
runtime=Path('/workspace/scratch/cs-numeric-kernels/artifacts/numeric-canonical-probe/runtime-source/.lexlean/build/b2417b32339d6c95b594a79c0e52b2537638369ea14bd783f721b8d60369ee2f/modules')
rows=[]
for p in [f/'modules/TypeRecon/Main.lean',runtime/'LexLeanRuntime/Portable.lean',runtime/'LexLeanRuntime/Collections.lean']:
 q=w/p.parent.name/p.name;q.parent.mkdir(exist_ok=True);q.write_bytes(p.read_bytes());rows.append({'source':str(p),'target':str(q),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(r/'stage-bindings.json').write_text(json.dumps(rows,indent=2)+'\n')
(w/'lakefile.toml').write_text('name = "type_recon"\nversion = "0.1.0"\n[[lean_lib]]\nname = "TypeReconDiagnostic"\nroots = ["LexLeanRuntime.Collections", "LexLeanRuntime.Portable", "TypeRecon.Main"]\nmoreLeanArgs = ["-j2"]\n')
(w/'lean-toolchain').write_text('leanprover/lean4:v4.32.1\n')
env=dict(os.environ,ELAN_HOME='/workspace/diagnostic-tools/elan',ELAN_TOOLCHAIN='leanprover/lean4:v4.32.1',PATH='/workspace/diagnostic-tools/elan/bin:'+os.environ['PATH'])
commands=[]
def run(args,log):
 with (r/log).open('w') as stream:
  p=subprocess.run(args,env=env,cwd=w,stdout=stream,stderr=subprocess.STDOUT,timeout=300)
 commands.append({'args':args,'cwd':str(w),'exit':p.returncode,'log':log});(r/'commands.json').write_text(json.dumps(commands,indent=2)+'\n')
 if p.returncode:raise SystemExit(p.returncode)
run(['lake','build','TypeReconDiagnostic'],'lake-build.log')
compiler=Path('/workspace/scratch/compiler-restoration-check/lean')
env.update(PATH='/workspace/diagnostic-tools/lean-4.32.1-linux/bin:'+os.environ['PATH'],LEAN_PATH=str(w/'.lake/build/lib/lean')+':'+str(compiler/'.lake/build/lib/lean'))
run([str(compiler/'.lake/build/bin/prod-export'),'--module','TypeRecon.Main','--root','TypeRecon.Main.narrowedIsZero','--ir-module','type_recon','--out',str(r/'extracted')],'extract.log')
run(['/workspace/diagnostic-tools/canonical-codegen-target/debug/numeric-compat-codegen',str(r/'extracted/kernel.ir'),str(r/'package')],'codegen.log')
(w/'Observe.lean').write_text('import TypeRecon.Main\n#print TypeRecon.Main.narrowedIsZero\n#print LexLeanRuntime.checkedConvert\n#eval ([0, 1, 255, 256, 257, 2147483647, 2147483648, 4294967296, 18446744073709551615] : List UInt64).map (fun n => (n, TypeRecon.Main.narrowedIsZero n))\n')
run(['lean','Observe.lean'],'lean-eval.log')
run(['/workspace/diagnostic-tools/rust-1.97.1/bin/rustc','--edition=2021','--crate-type=rlib','--crate-name=type_recon',str(r/'package/src/lib.rs'),'-o',str(r/'libtype_recon.rlib')],'native-compile.log')
(r/'native-main.rs').write_text('fn main() { for n in [0u64, 1, 255, 256, 257, 2147483647, 2147483648, 4294967296, 18446744073709551615] { println!("{} {}", n, type_recon::narrowedIsZero(n)); } }\n')
run(['/workspace/diagnostic-tools/rust-1.97.1/bin/rustc','--edition=2021',str(r/'native-main.rs'),'--extern',f'type_recon={r}/libtype_recon.rlib','-o',str(r/'native-main')],'harness-compile.log')
run([str(r/'native-main')],'native-eval.log')
