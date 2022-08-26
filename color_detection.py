import cv2 
import numpy as np

img = cv2.imread('photos/multi.png')

hsv = cv2.cvtColor(img,cv2.COLOR_BGR2HSV)

cv2.imshow("HSV Image", hsv)


lower_green = np.array([0, 255, 0]) #rgb values
upper_green = np.array([0, 255, 0])

masking = cv2.inRange(img, lower_green, upper_green)

cv2.imshow("Green Color detection", masking)
cv2.waitKey(0)


cv2.imshow("HSV Image", img)
print(masking)
