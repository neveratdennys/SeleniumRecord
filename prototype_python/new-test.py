# Generated by Selenium IDE
import pytest
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities


class TestNewTest():

def setup_method(self, method):
  self.driver = webdriver.Chrome()
  self.vars = {}

def teardown_method(self, method):
  self.driver.quit()

  def test_newTest(self):
    self.driver.get("https://unitydev.ca/support/dashboard/")
time.sleep(10)
self.driver.find_element(By.CSS_SELECTOR, ".MuiTab-root:nth-child(4)").click()
self.driver.find_element(By.CSS_SELECTOR, ".jss190:nth-child(1) .MuiButton-label").click()
self.driver.find_element(By.CSS_SELECTOR, ".MuiButton-contained > .MuiButton-label").click()
self.driver.find_element(By.CSS_SELECTOR, ".jss213 > .MuiButton-label").click()
self.driver.find_element(By.ID, "first-name").click()
self.driver.find_element(By.ID, "first-name").send_keys("dennyTest")
self.driver.find_element(By.ID, "last-name").send_keys("test")
self.driver.find_element(By.ID, "email").send_keys("user6@vanbelletest.ca")
self.driver.find_element(By.ID, "roles").click()
self.driver.find_element(By.ID, "roles-option-13").click()
self.driver.find_element(By.CSS_SELECTOR, ".MuiCheckbox-colorSecondary > .MuiIconButton-label").click()
self.driver.find_element(By.CSS_SELECTOR, ".jss215:nth-child(12) .MuiButton-label").click()
  
