import Generator from './lib/generator';

export default Generator.generate()
  .then((rs) => {
    // console.log('index.js', rs);
  })
  .catch((err) => {
    console.log(err);
  });
