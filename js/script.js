


class SuperCon6BrainFuckCompiler
{
  data_ptr(){
    return '[' + this.rmap['data_ptr_high'] + ":" + this.rmap['data_ptr_low'] + ']';
  };

  chg_data_ptr(op){
    return ["mov r0," + this.rmap['data_ptr_low'],
    op + " r0",
    "skip c, 2", //skip if carry is zero
    "mov r0," + this.rmap['data_ptr_high'],
    op + " r0"]
  };

  insn_ptr(){
    return '[' + this.rmap['insn_ptr_high'] + ":" + this.rmap['insn_ptr_low'] + ']';
  };


  constructor(){

    this.rmap = {
      'data_ptr_low': 'r2',
      'data_ptr_high': 'r3',
      'insn_ptr_low': 'r4',
      'insn_ptr_high': 'r5'
    };

    this.insn = {
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
        '; load current instruction',
        'mov r0, '+ this.insn_ptr(),
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
        'jr main_execution_loop'

      ],



      // + Increment (increase by one) the byte at the data pointer.
      'label_plus': [
          "mov r7, 2",
          'mov r0, ' + this.data_ptr(),
          'inc r0', // inc 4 bits
          'mov ' + this.data_ptr() + ', r0',
          'skip c, 1',
          'jr label_plus_exit'].concat(
          this.chg_data_ptr('inc')).concat(
          ['label_plus_exit:', 'jr main_execution_loop']),

      // - Decrement (decrease by one) the byte at the data pointer.
      'label_minus': [
        "mov r7, 3",
        'mov r0, ' + this.data_ptr(),
        'dec r0', // inc 4 bits
        'mov ' + this.data_ptr() + ', r0',
        'skip c, 1',
        'jr label_minus_exit'].concat(
        this.chg_data_ptr('inc')).concat(
        ['label_minus_exit:', 'jr main_execution_loop']),
      // > Increment the data pointer (to point to the next cell to the right).
      'label_right':
        this.chg_data_ptr('inc').concat("mov r7, 4",'jr main_execution_loop'),


      // < Decrement the data pointer (to point to the next cell to the right).
      'label_left':
        this.chg_data_ptr('dec').concat("mov r7, 5",'jr main_execution_loop'),

      // . Output the byte at the data pointer.
      'label_print': [
        "mov r7, 6",
          'mov r0, 2 ; set page to 2',
          'mov [0xf0], r0 ; write to SFR',
          '; load data from data pointer into r0',
          'mov r0, ' + this.data_ptr(),
          'mov [48], r0',
          'jr main_execution_loop'
          ],
      // If the byte at the data pointer is zero,
      // then instead of moving the instruction pointer
      // forward to the next command, jump it forward to the command after the matching ] command.
      'label_open': [
        "mov r7, 7",
          'mov r0, ' + this.data_ptr(),
          'cp r0, 0',
          'skip nc, 1',
          'gosub find_matching_close_square',
          'jr main_execution_loop'
        ],

      'find_matching_close_square': [
        "mov r7, 8",
          'mov r0, ' + this.insn_ptr(),
          'cp r0, ' + this.insn[']'],
          'skip c, 1',
          'jr main_execution_loop',
          'mov r0, ' + this.insn_ptr(),
          'inc r0',
          'mov ' + this.insn_ptr() + ', r0',
          'jr find_matching_close_square'
        ],

      //If the byte at the data pointer is nonzero,
      // then instead of moving the instruction pointer forward
      // to the next command, jump it back to the command after the matching [ command.
      'label_close': [
        "mov r7, 9",
          'mov r0, ' + this.data_ptr(),
          'cp r0, 0',
          'skip nc, 1',
          'jr find_matching_open_square'
        ],

      'find_matching_open_square': [
        "mov r7, 10",
            'mov r0, ' + this.insn_ptr(),
            'cp r0, ' + this.insn['['],
            'skip c, 1',
            'jr main_execution_loop',
            'mov r0, ' + this.insn_ptr(),
            'inc r0' ,
            'mov ' + this.insn_ptr() + ', r0',
            'jr find_matching_open_square'
          ],

    };
  }

  compile(src_txt){
    let asm_txt = "";

    let general_purpose_ram_page0 = 10
    // now copy insrtuctions into insn memory
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
    // Now make sure the data memory starts after the instruction memory
    let ip_low = insn_ptr & 0xF;
    let ip_high = (insn_ptr & 0xF0) >> 4;
    asm_txt += "; locate Brain Fuck Data memory right after the last instruction\n"
    asm_txt += "mov " + this.rmap['data_ptr_low'] + ", " + ip_low.toString() + "\n";
    asm_txt += "mov " + this.rmap['data_ptr_high'] + ", " + ip_high.toString() + "\n";

    asm_txt += "; load initial program pointer\n"; insn_ptr++;
    asm_txt += "mov " + this.rmap['insn_ptr_low'] + ", " + general_purpose_ram_page0.toString() + "\n";insn_ptr++;
    asm_txt += "mov " + this.rmap['insn_ptr_high']+ ", 0\n";insn_ptr++;
    asm_txt += "jr main_execution_loop\n\n\n";insn_ptr++;
    asm_txt += "mov r7, 1\n";

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
