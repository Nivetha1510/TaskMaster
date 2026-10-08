import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const PHOTO_SIZE = 256; // px; small enough to store with the account

// Opens the gallery or camera, lets the user crop to a square, and returns a small
// JPEG as a data URI. Returns { photo } on success, { canceled: true } if dismissed,
// or { error } with a message to show.
export async function pickProfilePhoto(source) {
  const isCamera = source === 'camera';
  const permission = isCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return {
      error: isCamera
        ? 'Camera access is needed to take a photo. You can allow it in your settings.'
        : 'Photo access is needed to choose a picture. You can allow it in your settings.',
    };
  }

  const options = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 };
  const result = isCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.length) return { canceled: true };

  try {
    const context = ImageManipulator.manipulate(result.assets[0].uri);
    const resized = await context.resize({ width: PHOTO_SIZE }).renderAsync();
    const saved = await resized.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
    return { photo: `data:image/jpeg;base64,${saved.base64}` };
  } catch (error) {
    return { error: 'Could not use that picture. Please try another one.' };
  }
}
