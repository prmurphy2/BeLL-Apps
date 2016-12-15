import unittest
import bell
import time

from base_case import is_travis
from base_case import on_platforms
from base_case import browsers
from base_case import BaseCase

from selenium.webdriver.common.keys import Keys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.alert import Alert
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support import expected_conditions as EC

@on_platforms(browsers)
class LoginTest(BaseCase):
                         
    def test_login_logout(self):
        """ Test the functionality of logging in, logging out, and 
        adding the configuration to a new nation
        """
        input = ("admin", "password")
        # if remote, test first login, otherwise test second login
        if is_travis():
            self.login_test(*input, True)
            self.configuration_test()
            self.logout_test()
            self.login_test(*input)
        else:
            self.login_test(*input)
            self.library_click_test()
            self.add_new_resource_click_test()
            self.fill_out_new_resources_form()
            self.check_for_resource()
            self.click_request_resource()
            
                        

        
        
    def login_test(self, username, password, first=False):
        """ (string, string, boolean) -> NoneType
        
        Helper function testing a correct login operation
        """
        driver = self.driver
        url = "http://127.0.0.1:5981/apps/_design/bell/MyApp/index.html"
        if first:
            id = "c84_code"
            expected = url + "#configuration/add"
        else:
            id = "dashboard"
            expected = url + "#dashboard"
        # login
        bell.login(driver, username, password)
        # wait for the next page
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, id)))
        # ensure it is the correct page
        actual = driver.current_url
        self.assertEqual(actual, expected)
        time.sleep(5)

    def library_click_test(self):
        driver = self.driver
        continue_link = driver.find_element_by_link_text('Library')
        continue_link.click()
        url = "http://127.0.0.1:5981/apps/_design/bell/MyApp/index.html"
        expected = url + "#resources"
        actual = driver.current_url
        self.assertEqual(actual, expected)
        time.sleep(5)

    def add_new_resource_click_test(self):
        driver = self.driver
        login_form = driver.find_element_by_id('addNewResource')
        login_form.click()
        url = "http://127.0.0.1:5981/apps/_design/bell/MyApp/index.html"
        expected = url + "#resource/add"
        actual = driver.current_url
        self.assertEqual(actual, expected)
        time.sleep(3)

    def fill_out_new_resources_form(self):
        driver = self.driver
        inputElement = driver.find_element_by_name('title')
        inputElement.send_keys('testapp')
        inputElement = driver.find_element_by_name('author')
        inputElement.send_keys('ole')
        inputElement = driver.find_element_by_name('Year')
        inputElement.send_keys('2016')
        select = Select(driver.find_element_by_name('language'))
        select.select_by_value('English')
        inputElement = driver.find_element_by_name('Publisher')
        inputElement.send_keys('ole')
        inputElement = driver.find_element_by_name('linkToLicense')
        inputElement.send_keys('ole')
        

        inputElementList = driver.find_elements_by_xpath(".//*[contains(text(), 'Select an Option')]")
        for x in range(0,len(inputElementList)):
            inputElementList[x].click()
            inputElementList[x].send_keys(Keys.RETURN)
        inputElement = driver.find_element_by_name('save')
        inputElement.click()
        time.sleep(3)

    def check_for_resource(self):
        driver = self.driver
        inputElementList = driver.find_elements_by_xpath(".//*[contains(text(), 'testapp')]")
        numberOfTestApps = (len(inputElementList))
        minimumNumberOfTestApps = 1
        self.assertGreaterEqual(numberOfTestApps, minimumNumberOfTestApps)

    def click_request_resource(self):
        driver = self.driver
        login_form = driver.find_element_by_id('requestResource')
        login_form.click()
        
    def configuration_test(self):
        """ NoneType -> NoneType
        
        Helper function to fill in the configuration form,
        and ensure it is successfully added to a new nation
        
        TODO: Check configuration values in CouchDB         
        """
        driver = self.driver
        fields = ["name", "code", "region", "nationName", "nationUrl", "notes"] 
        for field in fields:
            elem = driver.find_element_by_name(field)
            elem.send_keys("ole")

        # uncomment to test languages other than English
        # dropdown = Select(driver_find_element_by_name("selectLanguage")
        # dropdown.select_by_value("Spanish")

        submit = driver.find_element_by_id("formButton")
        submit.click()
        
        # if configuration was successful, accept confirmation alert
        actual = Alert(driver).text
        expected = "Configurations are successfully added."
        self.assertEqual(actual, expected)
        Alert(driver).accept()
        
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "dashboard")))
        
        # ensure configuration was submitted (TODO: check against CouchDB)
        actual = driver.current_url
        expected = "http://127.0.0.1:5981/apps/_design/bell/MyApp/index.html#dashboard"
        self.assertEqual(actual, expected)
         

if __name__ == "__main__":
    unittest.main()
