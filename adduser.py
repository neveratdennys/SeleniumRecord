import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

options = Options()
# Toggle this line for headless mode
#options.add_argument("--headless=new")
driver = webdriver.Chrome(options=options)
driver.implicitly_wait(15)
# Add formatted record tool output here

driver.get("https://unitydev.ca/support/dashboard/")
driver.find_element(By.ID, "signInName").click()
driver.find_element(By.ID, "signInName").send_keys("dzhang@univerus.com")
driver.find_element(By.ID, "password").send_keys("dM1$#CIOLtC")
driver.find_element(By.ID, "password").send_keys(Keys.ENTER)
driver.find_element(By.CSS_SELECTOR, ".MuiTab-root:nth-child(4)").click()
driver.find_element(By.CSS_SELECTOR, ".jss134:nth-child(1) .MuiButton-label").click()
driver.find_element(By.CSS_SELECTOR, ".MuiButton-contained > .MuiButton-label").click()
driver.find_element(By.CSS_SELECTOR, ".jss213 > .MuiButton-label").click()
driver.find_element(By.ID, "first-name").click()
driver.find_element(By.ID, "first-name").send_keys("dennyTest")
driver.find_element(By.ID, "last-name").send_keys("test")
driver.find_element(By.ID, "email").send_keys("user7@vanbelletest.ca")
driver.find_element(By.ID, "roles").click()
driver.find_element(By.ID, "roles-option-13").click()
driver.find_element(By.CSS_SELECTOR, ".MuiCheckbox-colorSecondary > .MuiIconButton-label").click()
driver.find_element(By.CSS_SELECTOR, ".jss215:nth-child(12) .MuiButton-label").click()


driver.quit()
