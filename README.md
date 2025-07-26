# streamlit-chunk-uploader
React-less custom component streamlit app
This is a demo to show how to implement a customized component in streamlit and without react.
The ultimate goal is use purely html and javascript to implement custom component, but streamlit officially don't have a all-in-one javascript lib to do that. So node is a must have framework.

## Pre requirements

### node v22.14.0
### npm 10.9.2
### python 3.12.3
#### Streamlit *pip install streamlit*

## Steps to start

- Install dependencies, under *chunk_upload* folder execute ```npm i```
- Build frontend dist, under *chunk_upload* folder execute ```npm run build``` , this operation generates an *index.html* and it's dependencies javascript files under *assets* folder
- Under root folder, execute ```streamlit run example_app.py``` it should display *You can now view your Streamlit app in your browser.* in the console and your web browser will display the main page.
