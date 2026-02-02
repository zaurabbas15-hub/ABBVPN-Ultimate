**<!DOCTYPE html>**

**<html>**

**<head>**

&nbsp;   \*\*<style>\*\*

        \*\*body {\*\* 

            \*\*background: #121212;\*\* 

            \*\*color: white;\*\* 

            \*\*font-family: Arial, sans-serif;\*\*

            \*\*display: flex;\*\* 

            \*\*flex-direction: column;\*\*

            \*\*align-items: center;\*\* 

            \*\*justify-content: center;\*\* 

            \*\*height: 100vh;\*\* 

            \*\*margin: 0;\*\*

            \*\*user-select: none;\*\*

        \*\*}\*\*

        \*\*h1 { margin-bottom: 40px; color: #3b82f6; }\*\*

        \*\*.btn {\*\* 

            \*\*width: 140px;\*\* 

            \*\*height: 140px;\*\* 

            \*\*border-radius: 50%;\*\* 

            \*\*border: 5px solid #333;\*\* 

            \*\*background: #1e1e1e;\*\* 

            \*\*color: #ef4444;\*\* 

            \*\*font-size: 24px;\*\* 

            \*\*font-weight: bold;\*\* 

            \*\*cursor: pointer;\*\* 

            \*\*transition: 0.3s;\*\*

            \*\*box-shadow: 0 0 20px rgba(0,0,0,0.5);\*\*

        \*\*}\*\*

        \*\*.btn:hover { border-color: #555; }\*\*

        

        \*\*/\\\* Когда включено \\\*/\*\*

        \*\*.active {\*\* 

            \*\*color: #22c55e;\*\* 

            \*\*border-color: #22c55e;\*\* 

            \*\*box-shadow: 0 0 40px rgba(34, 197, 94, 0.4);\*\*

        \*\*}\*\*

    \*\*</style>\*\*


**</head>**

**<body>**

&nbsp;   \*\*<h1>ABBVPN</h1>\*\*

    \*\*<button class="btn" id="btn" onclick="toggle()">OFF</button>\*\*



    \*\*<script>\*\*

        \*\*let isOn = false;\*\*

        \*\*function toggle() {\*\*

            \*\*isOn = !isOn;\*\*

            \*\*const btn = document.getElementById('btn');\*\*

            \*\*if (isOn) {\*\*

                \*\*btn.innerText = "ON";\*\*

                \*\*btn.classList.add('active');\*\*

            \*\*} else {\*\*

                \*\*btn.innerText = "OFF";\*\*

                \*\*btn.classList.remove('active');\*\*

            \*\*}\*\*

        \*\*}\*\*

    \*\*</script>\*\*


**</body>**

**</html>**


.
