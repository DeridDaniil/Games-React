export const createPosition = () => {
  const position = Array(8).fill('').map(_x => Array(8).fill(''));

  position[0][0] = 'white-checker';
  position[0][2] = 'white-checker';
  position[0][4] = 'white-checker';
  position[0][6] = 'white-checker';
  position[1][1] = 'white-checker';
  position[1][3] = 'white-checker';
  position[1][5] = 'white-checker';
  position[1][7] = 'white-checker';
  position[2][0] = 'white-checker';
  position[2][2] = 'white-checker';
  position[2][4] = 'white-checker';
  position[2][6] = 'white-checker';

  position[7][1] = 'black-checker';
  position[7][3] = 'black-checker';
  position[7][5] = 'black-checker';
  position[7][7] = 'black-checker';
  position[6][0] = 'black-checker';
  position[6][2] = 'black-checker';
  position[6][4] = 'black-checker';
  position[6][6] = 'black-checker';
  position[5][1] = 'black-checker';
  position[5][3] = 'black-checker';
  position[5][5] = 'black-checker';
  position[5][7] = 'black-checker';

  return position;
}