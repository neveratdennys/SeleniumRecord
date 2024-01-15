from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

# Create a new ChromeOptions object
chrome_options = Options()
# Add the --headless flag to the ChromeOptions object
chrome_options.add_argument('--headless')


driver = webdriver.Chrome()

driver.get("https://vanbelle.unitydev.ca/menupage/cee34ba4-eb0e-4a1e-bcf7-eed443341801/")
driver.implicitly_wait(15)
driver.find_element(By.CSS_SELECTOR, ".jss46").click()
driver.find_element(By.CSS_SELECTOR, ".MuiInputBase-root").click()
driver.find_element(By.ID, "current-tenant-option-1").click()
driver.find_element(By.CSS_SELECTOR, "#useId\\(name\\) > div:nth-child(1)").click()
driver.find_element(By.CSS_SELECTOR, ".jss45 > .MuiButtonBase-root").click()
driver.find_element(By.CSS_SELECTOR, ".MuiInputBase-root").click()
driver.find_element(By.ID, "current-tenant-option-0").click()
driver.find_element(By.CSS_SELECTOR, "#useId\\(name\\) > div:nth-child(1)").click()
driver.find_element(By.CSS_SELECTOR, ".jss111").click()
driver.find_element(By.CSS_SELECTOR, ".jss829 .MuiTypography-root").click()

driver.quit()
