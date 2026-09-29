// Recorta a imagem para a proporção pedida (centralizada) e reduz o tamanho antes de enviar.
export const resizeImage = (file, { width, height, type = 'image/jpeg', quality = 0.82 }) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('Selecione um arquivo de imagem.'));
    return;
  }
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => {
    const image = new Image();
    image.onerror = reject;
    image.onload = () => {
      const ratio = width / height;
      const sourceWidth = Math.min(image.width, image.height * ratio);
      const sourceHeight = sourceWidth / ratio;
      const scale = Math.min(1, width / sourceWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sourceWidth * scale);
      canvas.height = Math.round(sourceHeight * scale);
      canvas.getContext('2d').drawImage(
        image,
        (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight,
        0, 0, canvas.width, canvas.height,
      );
      resolve(canvas.toDataURL(type, quality));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});
