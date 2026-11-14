"""Cocktail Trees generator: lays out one or more base spirits' radial trees and writes data/<base>.js.

Each entry in BASES is a dict with BASE / TITLE / BLURB / TREE / RX. Run:  python3 gen.py
Every recipe in RX must list exactly the drink's cumulative ingredients from TREE (checked by an assert).
"""
import math, json, os
T = lambda n, d, k=(): (n, d, list(k))
ST = "Stir with ice, strain into a coupe."
SH = "Shake with ice, strain into a coupe."
MT = "Stir with ice, strain into a chilled glass."
BU = "Build over ice in a tall glass."

# ---------- gin ----------
GIN = dict(
 BASE="Gin",
 TITLE="Gin Cocktail Tree",
 BLURB="From Pink Gin to the Ramos Gin Fizz: martinis, sours, fizzes and the vermouth family.",
 TREE=[
 T("Pink Gin", ["+ Angostura bitters"]),
 T("Gin & Tonic", ["+ tonic water"]),
 T("Gimlet", ["+ lime juice", "+ sugar syrup"], [
    T("Pegu Club", ["− sugar syrup", "+ orange curaçao", "+ Angostura bitters", "+ orange bitters"]),
    T("Last Word", ["− sugar syrup", "+ green Chartreuse", "+ maraschino"]),
    T("Gin Rickey", ["− sugar syrup", "+ soda water"]),
    T("Southside", ["+ mint"], [
        T("Eastside", ["+ cucumber"]),
        T("Gin-Gin Mule", ["+ ginger beer"])]),
 ]),
 T("Gin Sour", ["+ lemon juice", "+ sugar syrup"], [
    T("French 75", ["+ Champagne"]),
    T("Bramble", ["+ crème de mûre"]),
    T("Gin Basil Smash", ["+ basil"]),
    T("Enzoni", ["+ Campari", "+ green grapes"]),
    T("Tom Collins", ["+ soda water"], [
        T("Silver Fizz", ["+ egg white"], [
            T("Ramos Gin Fizz", ["+ lime juice", "+ cream", "+ orange flower water"])])]),
    T("Bee's Knees", ["− sugar syrup", "+ honey syrup"]),
    T("Clover Club", ["− sugar syrup", "+ raspberry syrup", "+ egg white"]),
    T("Aviation", ["− sugar syrup", "+ maraschino", "+ crème de violette"]),
    T("White Lady", ["− sugar syrup", "+ Cointreau"], [
        T("Jasmine", ["+ Campari"]),
        T("Breakfast Martini", ["+ orange marmalade"]),
        T("Corpse Reviver No. 2", ["+ Lillet Blanc", "+ absinthe"])]),
 ]),
 T("Orange Blossom", ["+ orange juice"], [
    T("Monkey Gland", ["+ grenadine", "+ absinthe"])]),
 T("Greyhound", ["+ grapefruit juice"], [
    T("Salty Dog", ["+ salt rim"])]),
 T("Alexander", ["+ crème de cacao", "+ cream"]),
 T("Dubonnet Cocktail", ["+ Dubonnet"]),
 T("Gin & It", ["+ sweet vermouth"], [
    T("Hanky Panky", ["+ Fernet-Branca"]),
    T("Bijou", ["+ green Chartreuse", "+ orange bitters"]),
    T("Martinez", ["+ maraschino", "+ orange bitters"]),
    T("Negroni", ["+ Campari"]),
 ]),
 T("Dry Martini", ["+ dry vermouth"], [
    T("Perfect Martini", ["+ sweet vermouth"], [
        T("Bronx", ["+ orange juice"])]),
    T("Cardinale", ["+ Campari"]),
    T("Obituary", ["+ absinthe"], [
        T("Tuxedo No. 2", ["+ maraschino", "+ orange bitters"])]),
    T("Gibson", ["+ cocktail onion"]),
    T("Dirty Martini", ["+ olive brine"]),
 ]),
 T("Alaska", ["+ yellow Chartreuse", "+ orange bitters"]),
 T("White Negroni", ["+ Lillet Blanc", "+ Suze"]),
 T("Vesper", ["+ vodka", "+ Lillet Blanc"]),
 ],
 RX={
 "Pink Gin": ({"gin":"60 ml","Angostura bitters":"3 dashes"}, [ST, "Lemon twist."]),
 "Gin & Tonic": ({"gin":"50 ml","tonic water":"120 ml"}, [BU, "Lime or lemon wedge."]),
 "Gimlet": ({"gin":"60 ml","lime juice":"22 ml","sugar syrup":"22 ml"}, [SH, "Lime wheel."]),
 "Pegu Club": ({"gin":"60 ml","lime juice":"22 ml","orange curaçao":"22 ml","Angostura bitters":"1 dash","orange bitters":"1 dash"}, [SH]),
 "Last Word": ({"gin":"22 ml","lime juice":"22 ml","green Chartreuse":"22 ml","maraschino":"22 ml"}, [SH]),
 "Gin Rickey": ({"gin":"60 ml","lime juice":"15 ml","soda water":"top up"}, [BU, "Drop in the lime shell."]),
 "Southside": ({"gin":"60 ml","lime juice":"22 ml","sugar syrup":"22 ml","mint":"8 leaves"}, ["Shake hard with ice,", "fine-strain into a coupe."]),
 "Eastside": ({"gin":"60 ml","lime juice":"22 ml","sugar syrup":"22 ml","mint":"8 leaves","cucumber":"3 slices"}, ["Muddle the cucumber, shake hard,", "fine-strain into a coupe."]),
 "Gin-Gin Mule": ({"gin":"45 ml","lime juice":"22 ml","sugar syrup":"22 ml","mint":"8 leaves","ginger beer":"60 ml"}, ["Shake all but the ginger beer,", "strain over ice, top up."]),
 "Gin Sour": ({"gin":"60 ml","lemon juice":"22 ml","sugar syrup":"22 ml"}, [SH]),
 "French 75": ({"gin":"30 ml","lemon juice":"15 ml","sugar syrup":"15 ml","Champagne":"60 ml"}, ["Shake the first three, strain into", "a flute, top with Champagne."]),
 "Bramble": ({"gin":"50 ml","lemon juice":"25 ml","sugar syrup":"12 ml","crème de mûre":"15 ml"}, ["Shake, strain over crushed ice,", "drizzle the mûre on top."]),
 "Gin Basil Smash": ({"gin":"60 ml","lemon juice":"25 ml","sugar syrup":"20 ml","basil":"10 leaves"}, ["Muddle the basil, shake hard,", "fine-strain over ice."]),
 "Enzoni": ({"gin":"30 ml","lemon juice":"22 ml","sugar syrup":"15 ml","Campari":"30 ml","green grapes":"5"}, ["Muddle the grapes, shake,", "strain over ice."]),
 "Tom Collins": ({"gin":"50 ml","lemon juice":"25 ml","sugar syrup":"15 ml","soda water":"top up"}, [BU, "Lemon slice."]),
 "Silver Fizz": ({"gin":"50 ml","lemon juice":"25 ml","sugar syrup":"15 ml","soda water":"top up","egg white":"1"}, ["Shake without ice, then with ice,", "strain into a tall glass, top up."]),
 "Ramos Gin Fizz": ({"gin":"50 ml","lemon juice":"15 ml","sugar syrup":"25 ml","soda water":"top up","egg white":"1","lime juice":"15 ml","cream":"25 ml","orange flower water":"3 dashes"}, ["Shake long and hard, strain into", "a tall glass, top with soda."]),
 "Bee's Knees": ({"gin":"60 ml","lemon juice":"22 ml","honey syrup":"22 ml"}, [SH]),
 "Clover Club": ({"gin":"50 ml","lemon juice":"22 ml","raspberry syrup":"15 ml","egg white":"1"}, ["Shake without ice, then with ice,", "strain into a coupe."]),
 "Aviation": ({"gin":"50 ml","lemon juice":"22 ml","maraschino":"15 ml","crème de violette":"7 ml"}, [SH, "Cherry."]),
 "White Lady": ({"gin":"45 ml","lemon juice":"22 ml","Cointreau":"22 ml"}, [SH]),
 "Jasmine": ({"gin":"45 ml","lemon juice":"22 ml","Cointreau":"7 ml","Campari":"7 ml"}, [SH, "Lemon twist."]),
 "Breakfast Martini": ({"gin":"50 ml","lemon juice":"15 ml","Cointreau":"15 ml","orange marmalade":"1 tsp"}, ["Stir the marmalade into the gin,", "shake, fine-strain into a coupe."]),
 "Corpse Reviver No. 2": ({"gin":"22 ml","lemon juice":"22 ml","Cointreau":"22 ml","Lillet Blanc":"22 ml","absinthe":"1 dash"}, [SH]),
 "Orange Blossom": ({"gin":"45 ml","orange juice":"45 ml"}, [SH]),
 "Monkey Gland": ({"gin":"50 ml","orange juice":"30 ml","grenadine":"1 tsp","absinthe":"1 dash"}, [SH]),
 "Greyhound": ({"gin":"50 ml","grapefruit juice":"120 ml"}, [BU]),
 "Salty Dog": ({"gin":"50 ml","grapefruit juice":"120 ml","salt":"rim"}, ["Salt the rim of a tall glass,", "build over ice."]),
 "Alexander": ({"gin":"30 ml","crème de cacao":"30 ml","cream":"30 ml"}, [SH, "Grated nutmeg."]),
 "Dubonnet Cocktail": ({"gin":"30 ml","Dubonnet":"60 ml"}, [ST, "Lemon twist."]),
 "Gin & It": ({"gin":"45 ml","sweet vermouth":"45 ml"}, [ST, "Orange twist."]),
 "Hanky Panky": ({"gin":"45 ml","sweet vermouth":"45 ml","Fernet-Branca":"2 dashes"}, [ST, "Orange twist."]),
 "Bijou": ({"gin":"30 ml","sweet vermouth":"30 ml","green Chartreuse":"30 ml","orange bitters":"1 dash"}, [ST]),
 "Martinez": ({"gin":"45 ml","sweet vermouth":"45 ml","maraschino":"7 ml","orange bitters":"2 dashes"}, [ST, "Orange twist."]),
 "Negroni": ({"gin":"30 ml","sweet vermouth":"30 ml","Campari":"30 ml"}, ["Stir with ice, strain over fresh ice.", "Orange peel."]),
 "Dry Martini": ({"gin":"60 ml","dry vermouth":"10 ml"}, [MT, "Lemon twist or olive."]),
 "Perfect Martini": ({"gin":"60 ml","dry vermouth":"10 ml","sweet vermouth":"10 ml"}, [MT]),
 "Bronx": ({"gin":"45 ml","dry vermouth":"15 ml","sweet vermouth":"15 ml","orange juice":"30 ml"}, [SH]),
 "Cardinale": ({"gin":"30 ml","dry vermouth":"30 ml","Campari":"30 ml"}, ["Stir with ice, strain over fresh ice.", "Lemon peel."]),
 "Obituary": ({"gin":"60 ml","dry vermouth":"10 ml","absinthe":"5 ml"}, [MT]),
 "Tuxedo No. 2": ({"gin":"60 ml","dry vermouth":"15 ml","absinthe":"1 dash","maraschino":"5 ml","orange bitters":"2 dashes"}, [MT]),
 "Gibson": ({"gin":"60 ml","dry vermouth":"10 ml","cocktail onion":"1"}, [MT]),
 "Dirty Martini": ({"gin":"60 ml","dry vermouth":"10 ml","olive brine":"10 ml"}, [MT, "Olives."]),
 "Alaska": ({"gin":"60 ml","yellow Chartreuse":"15 ml","orange bitters":"1 dash"}, [ST]),
 "White Negroni": ({"gin":"45 ml","Lillet Blanc":"30 ml","Suze":"22 ml"}, ["Stir with ice, strain over fresh ice.", "Lemon peel."]),
 "Vesper": ({"gin":"60 ml","vodka":"20 ml","Lillet Blanc":"10 ml"}, ["Shake with ice,", "strain into a chilled glass.", "Lemon twist."]),
 })

# ---------- vodka ----------
VODKA = dict(
 BASE="Vodka",
 TITLE="Vodka Cocktail Tree",
 BLURB="Vodka's neutral base carries juices, coffee, cream and ginger: from the Moscow Mule to the Espresso Martini.",
 TREE=[
 T("Vodka Tonic", ["+ tonic water"]),
 T("Vodka Martini", ["+ dry vermouth"], [
    T("Vodka Gibson", ["+ cocktail onion"]),
 ]),
 T("Moscow Mule", ["+ lime juice", "+ ginger beer"]),
 T("Screwdriver", ["+ orange juice"], [
    T("Harvey Wallbanger", ["+ Galliano"]),
 ]),
 T("Cape Codder", ["+ cranberry juice"], [
    T("Sea Breeze", ["+ grapefruit juice"]),
    T("Bay Breeze", ["+ pineapple juice"]),
    T("Cosmopolitan", ["+ Cointreau", "+ lime juice"]),
 ]),
 T("Black Russian", ["+ coffee liqueur"], [
    T("White Russian", ["+ cream"]),
    T("Espresso Martini", ["+ espresso", "+ sugar syrup"]),
 ]),
 T("Vodka Sour", ["+ lemon juice", "+ sugar syrup"], [
    T("Vodka Collins", ["+ soda water"]),
    T("Lemon Drop", ["+ Cointreau"], [
        T("Kamikaze", ["− lemon juice", "− sugar syrup", "+ lime juice"]),
    ]),
 ]),
 T("Bloody Mary", ["+ tomato juice", "+ lemon juice", "+ Worcestershire sauce", "+ Tabasco", "+ celery salt", "+ black pepper"]),
 T("Caipiroska", ["+ lime", "+ sugar"]),
 ],
 RX={
 "Vodka Tonic": ({"vodka":"50 ml","tonic water":"120 ml"}, [BU, "Lime wedge."]),
 "Vodka Martini": ({"vodka":"60 ml","dry vermouth":"10 ml"}, [MT, "Lemon twist or olive."]),
 "Vodka Gibson": ({"vodka":"60 ml","dry vermouth":"10 ml","cocktail onion":"1"}, [MT]),
 "Moscow Mule": ({"vodka":"45 ml","lime juice":"15 ml","ginger beer":"120 ml"}, ["Build over ice in a copper mug.", "Lime wedge."]),
 "Screwdriver": ({"vodka":"50 ml","orange juice":"120 ml"}, [BU]),
 "Harvey Wallbanger": ({"vodka":"45 ml","orange juice":"120 ml","Galliano":"15 ml"}, ["Build vodka and juice over ice,", "float the Galliano on top."]),
 "Cape Codder": ({"vodka":"50 ml","cranberry juice":"120 ml"}, [BU, "Lime wedge."]),
 "Sea Breeze": ({"vodka":"45 ml","cranberry juice":"90 ml","grapefruit juice":"30 ml"}, [BU]),
 "Bay Breeze": ({"vodka":"45 ml","cranberry juice":"60 ml","pineapple juice":"60 ml"}, [BU]),
 "Cosmopolitan": ({"vodka":"45 ml","cranberry juice":"30 ml","Cointreau":"15 ml","lime juice":"15 ml"}, [SH, "Lemon twist."]),
 "Black Russian": ({"vodka":"50 ml","coffee liqueur":"25 ml"}, ["Build over ice in a rocks glass,", "stir briefly."]),
 "White Russian": ({"vodka":"45 ml","coffee liqueur":"25 ml","cream":"30 ml"}, ["Build vodka and coffee liqueur,", "float the cream on top."]),
 "Espresso Martini": ({"vodka":"50 ml","coffee liqueur":"20 ml","espresso":"30 ml","sugar syrup":"10 ml"}, ["Shake hard with ice,", "fine-strain into a coupe."]),
 "Vodka Sour": ({"vodka":"60 ml","lemon juice":"22 ml","sugar syrup":"22 ml"}, [SH]),
 "Vodka Collins": ({"vodka":"50 ml","lemon juice":"25 ml","sugar syrup":"15 ml","soda water":"top up"}, [BU, "Lemon slice."]),
 "Lemon Drop": ({"vodka":"50 ml","lemon juice":"22 ml","sugar syrup":"10 ml","Cointreau":"15 ml"}, [SH, "Sugar-rimmed glass."]),
 "Kamikaze": ({"vodka":"30 ml","Cointreau":"30 ml","lime juice":"30 ml"}, [SH]),
 "Bloody Mary": ({"vodka":"45 ml","tomato juice":"120 ml","lemon juice":"10 ml","Worcestershire sauce":"3 dashes","Tabasco":"2 dashes","celery salt":"pinch","black pepper":"pinch"}, ["Build over ice, roll between tins,", "celery stalk."]),
 "Caipiroska": ({"vodka":"50 ml","lime":"1","sugar":"2 tsp"}, ["Muddle lime and sugar,", "add vodka, pack with crushed ice."]),
 })

# ---------- rum ----------
RUM = dict(
 BASE="Rum",
 TITLE="Rum Cocktail Tree",
 BLURB="From Rum & Coke to the Mai Tai: daiquiris, highballs and the tiki family.",
 TREE=[
 T("Rum & Coke", ["+ cola"], [
    T("Cuba Libre", ["+ lime juice"]),
 ]),
 T("Dark & Stormy", ["+ lime juice", "+ ginger beer"]),
 T("Caipirissima", ["+ lime", "+ sugar"]),
 T("Daiquiri", ["+ lime juice", "+ sugar syrup"], [
    T("Floridita", ["+ maraschino"]),
    T("Hemingway Daiquiri", ["− sugar syrup", "+ grapefruit juice", "+ maraschino"]),
    T("Mojito", ["+ mint", "+ soda water"], [
        T("Old Cuban", ["− soda water", "+ Angostura bitters", "+ Champagne"]),
    ]),
    T("Mai Tai", ["− sugar syrup", "+ orgeat", "+ orange curaçao"]),
    T("Jungle Bird", ["+ pineapple juice", "+ Campari"]),
 ]),
 T("Rum Sour", ["+ lemon juice", "+ sugar syrup"]),
 T("Piña Colada", ["+ pineapple juice", "+ coconut cream"], [
    T("Painkiller", ["+ orange juice"]),
 ]),
 T("Hurricane", ["+ orange juice", "+ passion fruit syrup", "+ lime juice"]),
 T("El Presidente", ["+ dry vermouth", "+ orange curaçao", "+ grenadine"]),
 ],
 RX={
 "Rum & Coke": ({"rum":"50 ml","cola":"120 ml"}, [BU]),
 "Cuba Libre": ({"rum":"50 ml","cola":"120 ml","lime juice":"15 ml"}, [BU, "Lime wedge."]),
 "Dark & Stormy": ({"rum":"50 ml","lime juice":"15 ml","ginger beer":"120 ml"}, ["Build over ice in a tall glass,", "float the dark rum on top."]),
 "Caipirissima": ({"rum":"50 ml","lime":"1","sugar":"2 tsp"}, ["Muddle lime and sugar,", "add rum, pack with crushed ice."]),
 "Daiquiri": ({"rum":"60 ml","lime juice":"22 ml","sugar syrup":"15 ml"}, [SH]),
 "Floridita": ({"rum":"60 ml","lime juice":"22 ml","sugar syrup":"7 ml","maraschino":"7 ml"}, [SH]),
 "Hemingway Daiquiri": ({"rum":"60 ml","lime juice":"15 ml","grapefruit juice":"22 ml","maraschino":"7 ml"}, [SH]),
 "Mojito": ({"rum":"50 ml","lime juice":"22 ml","sugar syrup":"15 ml","mint":"8 leaves","soda water":"top up"}, ["Muddle mint with syrup,", "build over crushed ice, top up."]),
 "Old Cuban": ({"rum":"45 ml","lime juice":"22 ml","sugar syrup":"15 ml","mint":"6 leaves","Angostura bitters":"2 dashes","Champagne":"60 ml"}, ["Shake the first five,", "strain into a flute, top with Champagne."]),
 "Mai Tai": ({"rum":"45 ml","lime juice":"22 ml","orgeat":"15 ml","orange curaçao":"15 ml"}, ["Shake with ice, strain over", "crushed ice. Mint sprig."]),
 "Jungle Bird": ({"rum":"45 ml","lime juice":"15 ml","sugar syrup":"15 ml","pineapple juice":"45 ml","Campari":"22 ml"}, ["Shake with ice,", "strain over fresh ice."]),
 "Rum Sour": ({"rum":"60 ml","lemon juice":"22 ml","sugar syrup":"22 ml"}, [SH]),
 "Piña Colada": ({"rum":"45 ml","pineapple juice":"90 ml","coconut cream":"45 ml"}, ["Blend with crushed ice,", "pour into a hurricane glass."]),
 "Painkiller": ({"rum":"45 ml","pineapple juice":"90 ml","coconut cream":"30 ml","orange juice":"30 ml"}, ["Shake with ice, strain over", "crushed ice. Grated nutmeg."]),
 "Hurricane": ({"rum":"60 ml","orange juice":"30 ml","passion fruit syrup":"30 ml","lime juice":"15 ml"}, ["Shake with ice, strain over", "crushed ice in a hurricane glass."]),
 "El Presidente": ({"rum":"60 ml","dry vermouth":"30 ml","orange curaçao":"7 ml","grenadine":"1 bar spoon"}, [ST, "Orange twist."]),
 })

# ---------- whiskey ----------
WHISKEY = dict(
 BASE="Whiskey",
 TITLE="Whiskey Cocktail Tree",
 BLURB="Bourbon, rye and Scotch: Old Fashioneds, Manhattans, sours and the amaro family.",
 TREE=[
 T("Whiskey Highball", ["+ soda water"]),
 T("Whiskey Ginger", ["+ ginger ale"]),
 T("Mamie Taylor", ["+ lime juice", "+ ginger beer"]),
 T("Old Fashioned", ["+ sugar syrup", "+ Angostura bitters"], [
    T("Sazerac", ["− sugar syrup", "− Angostura bitters", "+ sugar", "+ Peychaud's bitters", "+ absinthe"]),
 ]),
 T("Manhattan", ["+ sweet vermouth", "+ Angostura bitters"], [
    T("Black Manhattan", ["− sweet vermouth", "+ Averna", "+ orange bitters"]),
    T("Boulevardier", ["− Angostura bitters", "+ Campari"], [
        T("Old Pal", ["− sweet vermouth", "+ dry vermouth"]),
    ]),
    T("Toronto", ["− sweet vermouth", "+ Fernet-Branca", "+ sugar syrup"]),
    T("Vieux Carré", ["+ Cognac", "+ Bénédictine", "+ Peychaud's bitters"]),
 ]),
 T("Rusty Nail", ["+ Drambuie"]),
 T("Whiskey Sour", ["+ lemon juice", "+ sugar syrup"], [
    T("Boston Sour", ["+ egg white"], [
        T("New York Sour", ["+ red wine"]),
    ]),
    T("Gold Rush", ["− sugar syrup", "+ honey syrup"], [
        T("Penicillin", ["+ ginger syrup"]),
    ]),
    T("Paper Plane", ["− sugar syrup", "+ Aperol", "+ Amaro Nonino"]),
 ]),
 T("Mint Julep", ["+ mint", "+ sugar syrup"]),
 ],
 RX={
 "Whiskey Highball": ({"whiskey":"50 ml","soda water":"120 ml"}, [BU, "Lemon peel."]),
 "Whiskey Ginger": ({"whiskey":"50 ml","ginger ale":"120 ml"}, [BU, "Lime wedge."]),
 "Mamie Taylor": ({"whiskey":"50 ml","lime juice":"15 ml","ginger beer":"120 ml"}, [BU, "Lime wedge."]),
 "Old Fashioned": ({"whiskey":"60 ml","sugar syrup":"7 ml","Angostura bitters":"2 dashes"}, ["Stir with ice, strain over a", "large cube. Orange peel."]),
 "Sazerac": ({"whiskey":"60 ml","sugar":"1 cube","Peychaud's bitters":"3 dashes","absinthe":"rinse"}, ["Rinse a chilled rocks glass with absinthe,", "stir the rest with ice, strain in."]),
 "Manhattan": ({"whiskey":"50 ml","sweet vermouth":"25 ml","Angostura bitters":"2 dashes"}, [ST, "Cherry."]),
 "Black Manhattan": ({"whiskey":"50 ml","Angostura bitters":"1 dash","Averna":"25 ml","orange bitters":"1 dash"}, [ST, "Cherry."]),
 "Boulevardier": ({"whiskey":"45 ml","sweet vermouth":"30 ml","Campari":"30 ml"}, ["Stir with ice, strain over fresh ice.", "Orange peel."]),
 "Old Pal": ({"whiskey":"30 ml","dry vermouth":"30 ml","Campari":"30 ml"}, ["Stir with ice, strain into a coupe.", "Lemon peel."]),
 "Toronto": ({"whiskey":"60 ml","Angostura bitters":"1 dash","Fernet-Branca":"7 ml","sugar syrup":"7 ml"}, [ST, "Orange peel."]),
 "Vieux Carré": ({"whiskey":"25 ml","sweet vermouth":"25 ml","Angostura bitters":"2 dashes","Cognac":"25 ml","Bénédictine":"5 ml","Peychaud's bitters":"2 dashes"}, ["Stir with ice,", "strain over fresh ice in rocks."]),
 "Rusty Nail": ({"whiskey":"45 ml","Drambuie":"30 ml"}, ["Build over ice in a rocks glass,", "stir briefly. Lemon peel."]),
 "Whiskey Sour": ({"whiskey":"60 ml","lemon juice":"22 ml","sugar syrup":"22 ml"}, [SH, "Cherry."]),
 "Boston Sour": ({"whiskey":"60 ml","lemon juice":"22 ml","sugar syrup":"22 ml","egg white":"1"}, ["Shake without ice, then with ice,", "strain into a coupe."]),
 "New York Sour": ({"whiskey":"60 ml","lemon juice":"22 ml","sugar syrup":"22 ml","egg white":"1","red wine":"15 ml"}, ["Shake, strain, float the", "red wine over the back of a spoon."]),
 "Gold Rush": ({"whiskey":"60 ml","lemon juice":"22 ml","honey syrup":"22 ml"}, ["Shake with ice,", "strain over fresh ice in rocks."]),
 "Penicillin": ({"whiskey":"50 ml","lemon juice":"22 ml","honey syrup":"15 ml","ginger syrup":"7 ml"}, ["Shake, strain over fresh ice.", "Candied ginger."]),
 "Paper Plane": ({"whiskey":"22 ml","lemon juice":"22 ml","Aperol":"22 ml","Amaro Nonino":"22 ml"}, [SH]),
 "Mint Julep": ({"whiskey":"60 ml","mint":"8 leaves","sugar syrup":"15 ml"}, ["Muddle mint with syrup,", "add whiskey, pack with crushed ice."]),
 })

BASES = [GIN, VODKA, RUM, WHISKEY]

# ---------- layout ----------
def leaves(n): return sum(leaves(k) for k in n[2]) if n[2] else 1
def nbox(name): return (len(name)*8.6+30)/2, 21
def lbox(lines): return (max(len(l) for l in lines)*7.9+12)/2, (len(lines)*17+8)/2
def exit_pt(c, hw, hh, p, gap=0):
    dx, dy = p[0]-c[0], p[1]-c[1]
    s = min(hw/abs(dx) if dx else 1e9, hh/abs(dy) if dy else 1e9)
    s += gap/math.hypot(dx, dy)
    return (c[0]+dx*s, c[1]+dy*s)

RC = 62
G = 420
CAND = [0.5, 0.55, 0.45, 0.6, 0.4, 0.65, 0.35, 0.7, 0.3, 0.75, 0.25, 0.8, 0.84, 0.88, 0.2]
WD, HD, NS = 200.0, 110.0, 7200

def seg_hits(s, e, r, m=3):
    L = math.hypot(e[0]-s[0], e[1]-s[1]); k = max(2, int(L/6))
    for t in range(k+1):
        x = s[0]+(e[0]-s[0])*t/k; y = s[1]+(e[1]-s[1])*t/k
        if r[0]-m < x < r[2]+m and r[1]-m < y < r[3]+m: return True
    return False

def build_angles(SLOTS):
    cum = [0.0]
    for i in range(NS):
        th = -math.pi/2 + 2*math.pi*(i+0.5)/NS
        cum.append(cum[-1] + 1.0/(WD*abs(math.sin(th)) + HD*abs(math.cos(th))))
    def ang(q):
        target = (q % SLOTS)/SLOTS*cum[-1]
        lo, hi = 0, NS
        while hi-lo > 1:
            m = (lo+hi)//2
            if cum[m] <= target: lo = m
            else: hi = m
        f = (target-cum[lo])/(cum[lo+1]-cum[lo])
        return -math.pi/2 + 2*math.pi*(lo+f)/NS
    return ang

def build(TREE, BASE, U):
    SLOTS = sum(leaves(n) for n in TREE)
    ang = build_angles(SLOTS)
    radii = [0, U, U+G, U+1.9*G, U+2.75*G, U+3.6*G, U+4.4*G]
    nodes, edges = [], []
    def place(n, q0, depth, parent, ings):
        nl = leaves(n)
        a = ang(q0) + ((ang(q0+nl) - ang(q0)) % (2*math.pi) or 2*math.pi)/2
        if parent is None and nl == 1: depth = 2
        rad = radii[depth]
        c = (rad*math.cos(a), rad*math.sin(a))
        hw, hh = nbox(n[0])
        mine = list(ings)
        for d in n[1]:
            item = d[2:].replace(" rim", "")
            if d[0] == "+":
                if item not in mine: mine.append(item)
            else: mine.remove(item)
        idx = len(nodes)
        nodes.append(dict(name=n[0], c=c, hw=hw, hh=hh, ing=mine))
        if parent is None:
            s = (RC+4)*math.cos(a), (RC+4)*math.sin(a)
        else:
            p = nodes[parent]
            s = exit_pt(p["c"], p["hw"], p["hh"], c, 3)
        e = exit_pt(c, hw, hh, s, 7)
        lw, lh = lbox(n[1])
        edges.append(dict(s=s, e=e, lines=n[1], lw=lw, lh=lh, src=parent, dst=idx, lp=None))
        q = q0
        for k in n[2]:
            place(k, q, depth+1, idx, mine)
            q += leaves(k)
    q = -leaves(TREE[0])/2
    for n in TREE:
        place(n, q, 1, None, [BASE.lower()])
        q += leaves(n)
    NR = [(n["c"][0]-n["hw"], n["c"][1]-n["hh"], n["c"][0]+n["hw"], n["c"][1]+n["hh"]) for n in nodes]
    placed = []
    for ei, e in enumerate(edges):
        for f in CAND:
            p = (e["s"][0]+(e["e"][0]-e["s"][0])*f, e["s"][1]+(e["e"][1]-e["s"][1])*f)
            r = (p[0]-e["lw"], p[1]-e["lh"], p[0]+e["lw"], p[1]+e["lh"])
            m = 7
            ok = all(not (r[0]-m < o[2] and o[0]-m < r[2] and r[1]-m < o[3] and o[1]-m < r[3]) for o in NR+placed)
            cx = min(max(0, r[0]), r[2]); cy = min(max(0, r[1]), r[3])
            ok = ok and math.hypot(cx, cy) > RC+8
            ok = ok and all(not seg_hits(o["s"], o["e"], r, 4) for oi, o in enumerate(edges) if oi != ei)
            if ok: break
        else:
            f = 0.5
            p = (e["s"][0]+(e["e"][0]-e["s"][0])*0.5, e["s"][1]+(e["e"][1]-e["s"][1])*0.5)
            r = (p[0]-e["lw"], p[1]-e["lh"], p[0]+e["lw"], p[1]+e["lh"])
        e["lp"] = p; e["f"] = f; placed.append(r)
    return nodes, edges

def check(nodes, edges):
    R = [("n", i, n["c"][0]-n["hw"], n["c"][1]-n["hh"], n["c"][0]+n["hw"], n["c"][1]+n["hh"]) for i, n in enumerate(nodes)]
    R += [("l", i, e["lp"][0]-e["lw"], e["lp"][1]-e["lh"], e["lp"][0]+e["lw"], e["lp"][1]+e["lh"]) for i, e in enumerate(edges)]
    bad = 0; m = 6
    for i in range(len(R)):
        for j in range(i+1, len(R)):
            A, B = R[i], R[j]
            if A[2]-m < B[4] and B[2]-m < A[4] and A[3]-m < B[5] and B[3]-m < A[5]: bad += 1
    for ei, e in enumerate(edges):
        L = math.hypot(e["e"][0]-e["s"][0], e["e"][1]-e["s"][1]); k = max(2, int(L/6))
        for r in R:
            if (r[0] == "l" and r[1] == ei) or (r[0] == "n" and r[1] in (e["src"], e["dst"])): continue
            for t in range(k+1):
                x = e["s"][0]+(e["e"][0]-e["s"][0])*t/k; y = e["s"][1]+(e["e"][1]-e["s"][1])*t/k
                if r[2]-3 < x < r[4]+3 and r[3]-3 < y < r[5]+3: bad += 1; break
    for r in R:
        cx = min(max(0, r[2]), r[4]); cy = min(max(0, r[3]), r[5])
        if math.hypot(cx, cy) < RC+6: bad += 1
    return bad, R

def generate(cfg):
    BASE, TITLE, BLURB, TREE, RX = cfg["BASE"], cfg["TITLE"], cfg["BLURB"], cfg["TREE"], cfg["RX"]
    U = 450
    while True:
        nodes, edges = build(TREE, BASE, U)
        bad, R = check(nodes, edges)
        if bad == 0 or U > 900: break
        U += 10
    PADC = 150
    x0 = min(r[2] for r in R)-PADC; y0 = min(r[3] for r in R)-PADC
    x1 = max(r[4] for r in R)+PADC; y1 = max(r[5] for r in R)+PADC
    W, H = x1-x0, y1-y0
    print(BASE, "U", U, "bad", bad, "size", round(W), round(H), "nodes", len(nodes))
    out = []
    for i, n in enumerate(nodes):
        e = edges[i]; assert e["dst"] == i
        amt, meth = RX[n["name"]]
        assert set(amt) == set(n["ing"]), (n["name"], set(amt) ^ set(n["ing"]))
        rows = [[amt[k], k] for k in n["ing"]]
        aw = max(len(r[0]) for r in rows)*7.9
        iw = max(len(r[1]) for r in rows)*7.9
        cw = max(2*n["hw"]+26, 32+aw+12+iw+16, max(len(l) for l in meth)*6.9+30)
        ch = 46 + len(rows)*20 + 8 + len(meth)*18 + 12
        out.append(dict(n=n["name"], x=round(n["c"][0]-n["hw"]-x0, 1), y=round(n["c"][1]-n["hh"]-y0, 1), w=round(2*n["hw"], 1), h=42,
            p=-1 if e["src"] is None else e["src"], lab=e["lines"], f=e["f"], lw=round(2*e["lw"], 1), lh=round(2*e["lh"], 1),
            ing=n["ing"], rows=rows, aw=round(aw, 1), m=meth, cw=round(cw), ch=ch))
    DATA = dict(W=round(W), H=round(H), hub=dict(x=round(-x0, 1), y=round(-y0, 1), r=RC, t=BASE), nodes=out)
    ings = []
    for n in nodes:
        for i in n["ing"]:
            if i not in ings: ings.append(i)
    ings = [BASE.lower()] + sorted([i for i in ings if i != BASE.lower()], key=str.lower)
    DATA.update(id=BASE.lower(), name=BASE, title=TITLE, ings=ings, blurb=BLURB)
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(os.path.join(here, 'data'), exist_ok=True)
    open(os.path.join(here, 'data', f'{BASE.lower()}.js'), 'w', encoding='utf-8', newline='\n').write(
        "window.COCKTAIL_BASES=window.COCKTAIL_BASES||{};\nwindow.COCKTAIL_BASES[" + json.dumps(BASE.lower()) + "]=" + json.dumps(DATA, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("  max card", max(o["cw"] for o in out), max(o["ch"] for o in out))

for cfg in BASES:
    generate(cfg)
