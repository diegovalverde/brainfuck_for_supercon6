

class SuperCon6BrainFuckCompiler
{


  chg_ptr(ptr,op){
    let cond = 'nz';
    let operation = "inc r0";
    if (op === 'dec'){
      operation = 'sub r0, r1'; // dec does not work on simulator...
            //for dec, if result=1111 after operation, reset flag C
      cond = 'nc';
    }

    return [
    "mov r1, 1",
    "mov r0,[" + this.mmap[ptr+'_ptr']+']',
    operation,
    "mov ["+this.mmap[ptr+'_ptr']+"], r0",
    "skip " + cond + ", 4", //skip if carry is zero
    "mov r0,[" + this.mmap[ptr+'_ptr']+'+1]',
    "mov r7, 11",
    operation,
    'mov ['+this.mmap[ptr+'_ptr']+'+1] , r0'];

  };


  constructor(){

    this.mmap = {
      // data ptr at 0x20 - 0x21
      'insn_ptr': '0x22',
      'data_ptr': '0x20',
    };

    this.insn = {
      'eop': '0',
      '+': '1',
      '-': '2',
      '>': '3',
      '<': '4',
      '.': '5',
      '[': '6',
      ']': '7'
    };




    this.special_functions = {
      'main_execution_loop': [
        'mov r7, 1',
        '; load current instruction',
        'mov r0, ['+ this.mmap['data_ptr']+']',
        'mov r9, r0',
        'mov r0, ['+ this.mmap['data_ptr']+'+1]',
        'mov r9, r0',
        'mov r0, ['+ this.mmap['insn_ptr']+']',
        'mov r8, r0',
        'mov r1, r0',
        'mov r0, ['+ this.mmap['insn_ptr']+'+1]',
        'mov r8, r0',
        'mov r2, r0',
        'mov r0, [r2:r1]',
        '; decode the instruction',
        'cp r0, '+ this.insn['+'],
        'skip nz, 1',
        'jr  label_plus',
        'cp r0, '+ this.insn['-'],
        'skip nz, 1',
        'jr  label_minus',
        'cp r0, '+ this.insn['>'],
        'skip nz, 1',
        'jr  label_right',
        'cp r0, '+ this.insn['<'],
        'skip nz, 1',
        'jr  label_left',
        'cp r0, '+ this.insn['['],
        'skip nz, 1',
        'jr  label_open',
        'cp r0, '+ this.insn[']'],
        'skip nz, 1',
        'jr  label_close',
        'cp r0, '+ this.insn['.'],
        'skip nz, 1',
        'jr  label_print',
        'label_eop:',
        'cp r0, '+ this.insn['eop'],
        'skip nz, 1',
        'jr label_eop',
        'label_next_insn:']
        .concat(this.chg_ptr('insn','inc'))
        .concat('jr main_execution_loop'),

      'inc_data': [
        "mov r0,[" + this.mmap['data_ptr']+']',
        "mov r1, r0",
        "mov r0,[" + this.mmap['data_ptr']+'+ 1]',
        "mov r2, r0",
        "mov r0, [r2:r1]",
        "inc r0",
        "mov [r2:r1], r0",
        "jr label_next_insn "],

        'dec_data': [
          "mov r0,[" + this.mmap['data_ptr']+']',
          "mov r1, r0",
          "mov r0,[" + this.mmap['data_ptr']+'+ 1]',
          "mov r2, r0",
          "mov r0, [r2:r1]",
          "dec r0",
          "mov [r2:r1], r0",
          "jr label_next_insn "],

      // + Increment (increase by one) the byte at the data pointer.
      'label_plus': [
          "mov r7, 2",
          "jr inc_data",
          "jr label_next_insn"],

      // - Decrement (decrease by one) the byte at the data pointer.
      'label_minus': [
        "mov r7, 3",
        "jr dec_data",
        "jr label_next_insn"],
      // > Increment the data pointer (to point to the next cell to the right).
      'label_right':
        this.chg_ptr('data','inc')
          .concat("mov r7, 4",'jr label_next_insn'),


      // < Decrement the data pointer (to point to the next cell to the right).
      'label_left':
        this.chg_ptr('data','dec')
        .concat("mov r7, 5",'jr label_next_insn'),

      // . Output the byte at the data pointer.
      'label_print': [
        "mov r7, 6",
          'jr label_next_insn'
          ],
      // If the byte at the data pointer is zero,
      // then instead of moving the instruction pointer
      // forward to the next command, jump it forward to the command after the matching ] command.
      'label_open': [
        "mov r7, 7",
          'mov r0, [' + this.mmap['data_ptr']+']',
          'mov r1, r0',
          'mov r0, [' + this.mmap['data_ptr']+' + 1]',
          'mov r2, r0',
          'mov r0, [r2:r1]',
          'cp r0, 0',
          'skip nz, 1',
          'jr find_matching_close_square',
          'jr label_next_insn'
        ],

      'find_matching_close_square': [
          'mov r0, [' + this.mmap['insn_ptr']+']',
          'mov r1, r0',
          'mov r0, [' + this.mmap['insn_ptr']+'+1]',
          'mov r2, r0',
          'mov r0, [r2:r1]',
          'cp r0, ' + this.insn[']'],
          'skip nz, 1',
          'jr label_next_insn'].concat(
            this.chg_ptr('insn','inc')
          )
          .concat([
          'jr find_matching_close_square']),

      //If the byte at the data pointer is nonzero,
      // then instead of moving the instruction pointer forward
      // to the next command, jump it back to the command after the matching [ command.
      'label_close': [
        'mov r0, [' + this.mmap['data_ptr']+']',
        'mov r1, r0',
        'mov r0, [' + this.mmap['data_ptr']+' + 1]',
        'mov r2, r0',
        'mov r0, [r2:r1]',
        'cp r0, 0',
        'skip z, 1',
        'jr find_matching_open_square',
        'jr label_next_insn'],

      'find_matching_open_square': [
        'mov r7, 15',
        'mov r0, [' + this.mmap['insn_ptr']+']',
        'mov r1, r0',
        'mov r0, [' + this.mmap['insn_ptr']+'+1]',
        'mov r2, r0',
        'mov r0, [r2:r1]',
        'cp r0, ' + this.insn['['],
        'skip nz, 1',
        'jr label_next_insn'].concat(
          this.chg_ptr('insn','dec')
        )
        .concat([
        'jr find_matching_open_square']),

    };
  }

  compile(src_txt){
    let asm_txt = "";
    // Address from 0 to F in page0 are regs
    // stack starts in addr 0xA in page0

    // locate data at beginning of page 1
    let bf_data_address = 0x60;
    let dp_low = bf_data_address & 0xF;
    let dp_high = (bf_data_address & 0xF0) >> 4;
    asm_txt += "; locate Brain Fuck Data memory right after the last instruction\n"
    asm_txt += "mov r0, " + dp_low.toString() + "\n";
    asm_txt += "mov [" + this.mmap['data_ptr'] + "], r0\n" ;
    asm_txt += "mov r0, " + + dp_high.toString() + "\n";
    asm_txt += "mov [" + this.mmap['data_ptr'] + "+1], r0\n";
    asm_txt += "mov r0, " + dp_high.toString() + "\n";//3\n";
    asm_txt += "mov [0xf0], r0 ; write to SFR\n";


    let general_purpose_ram_page0 = 0xC0; //0x24
    // now copy instructions into insn memory
    asm_txt += ";Locate instruction memory area starting at address " +general_purpose_ram_page0.toString() +" \n"
    let insn_ptr = general_purpose_ram_page0;
    for (let i = 0; i < src_txt.length; i++){
      let key = src_txt[i];
      let val = this.insn[key];

      let ip_low = insn_ptr & 0xF;
      let ip_high = (insn_ptr & 0xF0) >> 4;

      asm_txt += ";"+ key + " ip: " + insn_ptr.toString() + "\n";
      asm_txt += "mov r0, " + val + "\n";
      asm_txt += "mov [" + ip_high.toString() +  ":" + ip_low.toString() + "] , r0\n";
      insn_ptr++;
    }

    asm_txt += "; load initial program pointer\n"; insn_ptr++;

    asm_txt += "mov r0," + (general_purpose_ram_page0 & 0xF).toString() + "\n";insn_ptr++;
    asm_txt += "mov [" + this.mmap['insn_ptr'] + "], r0\n"
    asm_txt += "mov r0," +((general_purpose_ram_page0 & 0XF0)>>4).toString() +"\n";insn_ptr++;
    asm_txt += "mov [" + this.mmap['insn_ptr'] + " + 1], r0\n"
    asm_txt += "jr main_execution_loop\n\n\n";insn_ptr++;


    // first place the main execution loop into the
    for (const [key, value] of Object.entries(this.special_functions)) {
      asm_txt += key + ":\n"
      for (let i = 0; i < value.length; i++){
          asm_txt += "; pc: " + insn_ptr.toString()+"\n";
          asm_txt += "\t" + value[i] + "\n";
          insn_ptr++;
      }

    }

    return asm_txt;
  }
};


function compileIt(){
  var parser = new SuperCon6BrainFuckCompiler();
  let text = document.getElementById('brian_fuck_input').value
  let asm_txt = parser.compile(text);

  document.getElementById('asm_output').value = asm_txt;
}
