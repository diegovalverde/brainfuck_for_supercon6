


class SuperConnBrainFuckCompiler
{

  constructor(){
    this.data_ptr = 0;
    this.insns_ptr =0;
    this.rmap = {
      'data_ptr_low': 'r2',
      'data_ptr_high': 'r3',
      'insn_ptr_low': 'r4',
      'insn_ptr_high': 'r5'
    };
    let data_ptr = function (){
      return '[' + this.rmap['data_ptr_high'] + ":" + this.rmap['data_ptr_low'] + ']'
    };

    let insn_ptr = function (){
      return '[' + this.rmap['insn_ptr_high'] + ":" + this.rmap['insn_ptr_low'] + ']'
    };


    this.opcode_map = {
      // Increment (increase by one) the byte at the data pointer.
      '+': {'operations': [
          'mov r0, ' + data_ptr(),
          'inc r0',
          'mov ' + data_ptr() + ', r0'
          ]},
      // Decrement (decrease by one) the byte at the data pointer.
      '-': {'operations': [
          'mov r0, ' + data_ptr(),
          'dec r0',
          'mov ' + data_ptr() + ', r0'
          ]},
      // Increment the data pointer (to point to the next cell to the right).
      '>': {'operations': [
          'mov r0, ' + this.rmap['data_ptr_low'],
          'inc r0 ' ,
          'mov ' + this.rmap['data_ptr_low'] + ', r0' ,
          'skip z, 1',
          'mov r0, ' + this.rmap['data_ptr_high'],
          'inc r0 ' ,
          'mov ' + this.rmap['data_ptr_high'] + ', r0' ,
          ]},

      '<': {'operations': [
          'mov r0, ' + this.rmap['data_ptr_low'],
          'dec r0 ' ,
          'mov ' + this.rmap['data_ptr_low'] + ', r0' ,
          'skip z, 1',
          'mov r0, ' + this.rmap['data_ptr_high'],
          'dec r0 ' ,
          'mov ' + this.rmap['data_ptr_high'] + ', r0' ,
          ]},
      // Output the byte at the data pointer.
      '.': {'operations': [
          'mov r0, 2 ; set page to 2',
          'mov [0xf0], r0 ; write to SFR',
          '; load data from data pointer into r0',
          'mov r0, ' + data_ptr(),
          'mov [48], r0'
          ]},
      // If the byte at the data pointer is zero,
      // then instead of moving the instruction pointer
      // forward to the next command, jump it forward to the command after the matching ] command.
      '[': {'operations': [
          'mov r0, ' + data_ptr(),
          'cp r0, 0',
          'skip nc, 1',
          'gosub find_matching_close_square'
        ]
      }

    };

    this.special_functions = {
      'main_execution_loop': [
        'main_execution_loop:',
        '; load current instruction',
        'mov r0, '+ insn_ptr(),
        '; decode the instruction',
        'cp r0, ',this.insn['+'],
        'skip c, 1',
        'gosub  label_plus',
        'cp r0, ',this.insn['-'],
        'skip c, 1',
        'gosub  label_minus',
        'cp r0, ',this.insn['>'],
        'skip c, 1',
        'gosub  label_right',
        'cp r0, ',this.insn['<'],
        'skip c, 1',
        'gosub  label_left',
        'cp r0, ',this.insn['['],
        'skip c, 1',
        'gosub  label_open',
        'cp r0, ',this.insn[']'],
        'skip c, 1',
        'gosub  label_close',

      ]

      'find_matching_close_square': [
        'find_matching_close_square:'
        'mov r0, ' + insn_ptr(),
        'cp r0, ' + this.insn[']'],
        'skip c, 1',
        'ret'
        'mov r0, ' + insn_ptr(),
        'inc r0',
        'mov ' + insn_ptr() + ', r0',
        'jr find_matching_close_square'
      ]
    };
  }

  compile(src_txt){

  }
};
