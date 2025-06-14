const CLOUD_NAME = 'dnxgnmpln';
const UPLOAD_PRESET = 'chat_uploads';

export async function uploadImageToCloudinary(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  return data.secure_url; // This is the image URL you can save to Firestore
}