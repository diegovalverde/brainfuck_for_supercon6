


class SuperCon6BrainFuckCompiler
{
  data_ptr(){
    return '[' + this.rmap['data_ptr_high'] + ":" + this.rmap['data_ptr_low'] + ']';
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
        'skip c, 1',
        'gosub  label_plus',
        'cp r0, '+ this.insn['-'],
        'skip c, 1',
        'gosub  label_minus',
        'cp r0, '+ this.insn['>'],
        'skip c, 1',
        'gosub  label_right',
        'cp r0, '+ this.insn['<'],
        'skip c, 1',
        'gosub  label_left',
        'cp r0, '+ this.insn['['],
        'skip c, 1',
        'gosub  label_open',
        'cp r0, '+ this.insn[']'],
        'skip c, 1',
        'gosub  label_close',
        'cp r0, '+ this.insn['.'],
        'skip c, 1',
        'gosub  label_print',
        'jr main_execution_loop'

      ],



      // + Increment (increase by one) the byte at the data pointer.
      'label_plus': [
          'mov r0, ' + this.data_ptr(),
          'inc r0',
          'mov ' + this.data_ptr() + ', r0\n'
          ],
      // - Decrement (decrease by one) the byte at the data pointer.
      'label_minus': [
          'mov r0, ' + this.data_ptr(),
          'dec r0',
          'mov ' + this.data_ptr() + ', r0\n'
          ],
      // > Increment the data pointer (to point to the next cell to the right).
      'label_right': [
          'mov r0, ' + this.rmap['data_ptr_low'],
          'inc r0 ' ,
          'mov ' + this.rmap['data_ptr_low'] + ', r0' ,
          'skip z, 1',
          'mov r0, ' + this.rmap['data_ptr_high'],
          'inc r0 ' ,
          'mov ' + this.rmap['data_ptr_high'] + ', r0' ,
          ],
      // <
      'label_left': [
          'mov r0, ' + this.rmap['data_ptr_low'],
          'dec r0 ' ,
          'mov ' + this.rmap['data_ptr_low'] + ', r0' ,
          'skip z, 1',
          'mov r0, ' + this.rmap['data_ptr_high'],
          'dec r0  \n' ,
          'mov ' + this.rmap['data_ptr_high'] + ', r0' ,
          ],
      // . Output the byte at the data pointer.
      'label_print': [
          'mov r0, 2 ; set page to 2',
          'mov [0xf0], r0 ; write to SFR',
          '; load data from data pointer into r0',
          'mov r0, ' + this.data_ptr(),
          'mov [48], r0'
          ],
      // If the byte at the data pointer is zero,
      // then instead of moving the instruction pointer
      // forward to the next command, jump it forward to the command after the matching ] command.
      'label_open': [
          'mov r0, ' + this.data_ptr(),
          'cp r0, 0',
          'skip nc, 1',
          'gosub find_matching_close_square'
        ],

      'find_matching_close_square': [
          'mov r0, ' + this.insn_ptr(),
          'cp r0, ' + this.insn[']'],
          'skip c, 1',
          'ret r0, 0',
          'mov r0, ' + this.insn_ptr(),
          'inc r0',
          'mov ' + this.insn_ptr() + ', r0',
          'jr find_matching_close_square'
        ],

      //If the byte at the data pointer is nonzero,
      // then instead of moving the instruction pointer forward
      // to the next command, jump it back to the command after the matching [ command.
      'label_close': [
          'mov r0, ' + this.data_ptr(),
          'cp r0, 0',
          'skip nc, 1',
          'gosub find_matching_open_square'
        ],

      'find_matching_open_square': [
            'mov r0, ' + this.insn_ptr(),
            'cp r0, ' + this.insn['['],
            'skip c, 1',
            'ret r0, 0',
            'mov r0, ' + this.insn_ptr(),
            'inc r0' ,
            'mov ' + this.insn_ptr() + ', r0',
            'jr find_matching_open_square'
          ],

    };
  }

  compile(src_txt){
    let asm_txt = "";


    // now copy insrtuctions into insn memory
    let insn_ptr = 0;
    for (let i = 0; i < src_txt.length; i++){
      asm_txt += "mov r0, " + this.insn[src_txt[i]] + "\n";
      asm_txt += "mov [ 0b0000 :" + insn_ptr.toString() + "] , r0\n";
      insn_ptr++;
    }

    asm_txt += "jr main_execution_loop\n\n\n";

    // first place the main execution loop into the
    for (const [key, value] of Object.entries(this.special_functions)) {
      asm_txt += key + ":\n"
      for (let i = 0; i < value.length; i++){
          asm_txt += "\t" + value[i] + "\n";
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
