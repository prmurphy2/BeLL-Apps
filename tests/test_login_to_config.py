import os
import sys
import time
import unittest
from selenium import webdriver
try:
    from sauceclient import SauceClient
except:
    pass
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def isTravis():
    try:
        os.environ['SAUCE_USERNAME']
    except:
        return False
    else:
        return True

if isTravis():
    USERNAME = os.environ['SAUCE_USERNAME']
    ACCESS_KEY = os.environ['SAUCE_ACCESS_KEY']
    sauce = SauceClient(USERNAME, ACCESS_KEY)
    browsers = [{"platform": "Windows 10",
                 "browserName": "firefox",
                 "version": "48",
                 "tunnel-identifier": os.environ['TRAVIS_JOB_NUMBER'],
                 "name": "integration",
                 "build": os.environ['TRAVIS_BUILD_NUMBER']}]
else:
    USERNAME = ""
    ACCESS_KEY = ""
    browsers = [{"platform": "Windows 10",
                 "browserName": "firefox",
                 "version": "48"}]

def on_platforms(platforms):
    def decorator(base_class):
        module = sys.modules[base_class.__module__].__dict__
        for i, platform in enumerate(platforms):
            name = "%s_%s" % (base_class.__name__, i + 1)
            d = {'desired_capabilities' : platform}
            module[name] = type(name, (base_class,), d)
    return decorator

#function checks to see if Jquery is loaded
def checkJquery(driver):    
    JqueryActive = driver.execute_script("return jQuery.active")
    while JqueryActive != 0:
        time.sleep(0.5)
        JqueryActive = driver.execute_script("return jQuery.active")

@on_platforms(browsers)

class LoginTest(unittest.TestCase):


            
    def setUp(self):
        if isTravis():
            self.desired_capabilities['name'] = self.id()
            sauce_url = "http://%s:%s@ondemand.saucelabs.com:80/wd/hub"
            self.driver = webdriver.Remote(desired_capabilities=self.desired_capabilities,
                                           command_executor=sauce_url % (USERNAME, ACCESS_KEY))
            self.driver.implicitly_wait(30)
        else:
            self.driver = webdriver.Firefox()
    def test_login(self):
        driver = self.driver
        # go to the home page
        driver.get("http://127.0.0.1:5982/apps/_design/bell/MyApp/index.html")
        # find the login element
        inputElement = driver.find_element_by_name("login")
        # type in the username
        inputElement.send_keys("admin")
        # find the password element
        inputElement = driver.find_element_by_name("password")
        # type in the password
        inputElement.send_keys("password")
        # submit the form
        inputElement.submit()
        # give it time to get to the next page
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "dashboard")))
        # print page
        print(driver.current_url)
        # ensure we're logged in        
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, "NationManagerLink")))  
        #finds NationManagerLink element
        inputElement = driver.find_element_by_id("NationManagerLink")
        #This function checks to see when Jquery has loaded             
        checkJquery(driver);
        #click element NationManagerLink
        inputElement.click()        
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, "configbutton")))
        inputElement = driver.find_element_by_id("configbutton")
        #This function checks to see when Jquery has loaded 
        checkJquery(driver);        
        inputElement.click()		
        #wait for element to load
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "name")))
        #Find the 'name' element
        inputElement = driver.find_element_by_name("name")
        #Type in 'name'
        inputElement.send_keys("name")
        #find the 'code' element
        #inputElement = driver.find_element_by_name("code")
        #Type in 'code'
        #inputElement.send_keys("code")
        #find the region element
        #inputElement = driver.find_element_by_name("region")
        #type in 'region'
        #inputElement.send_keys("region")
        #find the 'nationName' element
        #inputElement = driver.find_element_by_name("nationName")
        #type in 'nationName'
        #inputElement.send_keys("nationName")
        #find the nationURL element
        #inputElement = driver.find_element_by_name("nationUrl")
        #type in 'nationURL'
        #inputElement.send_keys("nationURL")
        #find the 'version' element
        #inputElement = driver.find_element_by_name("version")
        #type in 'version'
        #inputElement.send_keys("version")
        #find the notes element
        #inputElement = driver.find_element_by_name("notes")
        #type in notes
        #inputElement.send_keys("notes")
        #select 'selectlLanguage' dropdown menu needs select class
        #select = Select(driver.find_element_by_name("selectLanguage"))
        #Select English
        #select.select_by_visible_text('English')
    def tearDown(self):
        if isTravis():
            print("Link to your job: https://saucelabs.com/jobs/%s" % self.driver.session_id)
            try:
                if sys.exc_info() == (None, None, None):
                    sauce.jobs.update_job(self.driver.session_id, passed=True)
                else:
                    sauce.jobs.update_job(self.driver.session_id, passed=False)
            finally:
                self.driver.quit()
        else:
            self.driver.close()

if __name__ == "__main__":
    unittest.main()
